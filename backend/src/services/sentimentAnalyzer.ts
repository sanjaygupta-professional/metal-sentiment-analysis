import { SentimentResult, AnalyzedNews } from '../types';

const HUGGINGFACE_API_URL = 'https://router.huggingface.co/hf-inference/models/ProsusAI/finbert';

// Rate limiting for free tier
let requestCount = 0;
const MAX_REQUESTS_PER_REFRESH = 500; // Increased limit to support historical backfill

/**
 * Helper function to create a delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Map FinBERT label to a score on -1 to +1 scale
 */
function mapSentimentToScore(label: string, confidence: number): number {
  switch (label.toLowerCase()) {
    case 'positive':
      return confidence;      // 0 to 1
    case 'negative':
      return -confidence;     // -1 to 0
    case 'neutral':
    default:
      return 0;
  }
}

/**
 * Analyze sentiment of a single text using FinBERT via HuggingFace API
 */
export async function analyzeSentiment(
  text: string,
  apiKey: string
): Promise<SentimentResult> {
  if (requestCount >= MAX_REQUESTS_PER_REFRESH) {
    console.warn('Rate limit reached for this session');
    return {
      label: 'neutral',
      score: 0,
      confidence: 0
    };
  }

  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text.slice(0, 512), // FinBERT max token limit
        options: {
          wait_for_model: true
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        // Model is loading, wait and retry
        console.log('Model is loading, waiting 20 seconds...');
        await delay(20000);
        return analyzeSentiment(text, apiKey);
      }
      throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as Array<Array<{ label: string; score: number }>>;
    requestCount++;

    // FinBERT returns array of label scores
    // [[{label: 'positive', score: 0.8}, {label: 'negative', score: 0.1}, ...]]
    const scores = result[0];

    if (!scores || scores.length === 0) {
      throw new Error('Invalid response from FinBERT');
    }

    // Find the highest scoring sentiment
    const sorted = scores.sort((a, b) => b.score - a.score);
    const topSentiment = sorted[0];

    return {
      label: topSentiment.label.toLowerCase() as 'positive' | 'negative' | 'neutral',
      score: mapSentimentToScore(topSentiment.label, topSentiment.score),
      confidence: topSentiment.score
    };
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    // Return neutral on error to avoid blocking the pipeline
    return {
      label: 'neutral',
      score: 0,
      confidence: 0
    };
  }
}

/**
 * Analyze sentiment for multiple news items
 * Includes rate limiting delays between requests
 */
export async function analyzeNewsItems(
  newsItems: Array<{ id: string; title: string; description: string }>,
  apiKey: string
): Promise<AnalyzedNews[]> {
  const results: AnalyzedNews[] = [];

  for (let i = 0; i < newsItems.length; i++) {
    const item = newsItems[i];

    try {
      // Combine title and description for better context
      const textToAnalyze = `${item.title}. ${item.description}`.slice(0, 512);
      const sentiment = await analyzeSentiment(textToAnalyze, apiKey);

      results.push({
        newsId: item.id,
        title: item.title,
        sentiment,
        analyzedAt: new Date().toISOString()
      });

      // Rate limiting delay between requests (1 second)
      if (i < newsItems.length - 1) {
        await delay(1000);
      }
    } catch (error) {
      console.error(`Failed to analyze news ${item.id}:`, error);
      // Add with neutral sentiment on error
      results.push({
        newsId: item.id,
        title: item.title,
        sentiment: { label: 'neutral', score: 0, confidence: 0 },
        analyzedAt: new Date().toISOString()
      });
    }
  }

  return results;
}

/**
 * Calculate aggregate sentiment from analyzed news
 */
export function calculateAggregateSentiment(analyzedNews: AnalyzedNews[]): {
  averageScore: number;
  sentimentLabel: 'bullish' | 'bearish' | 'neutral';
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalCount: number;
} {
  if (analyzedNews.length === 0) {
    return {
      averageScore: 0,
      sentimentLabel: 'neutral',
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      totalCount: 0
    };
  }

  const scores = analyzedNews.map(n => n.sentiment.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const positiveCount = analyzedNews.filter(n => n.sentiment.label === 'positive').length;
  const negativeCount = analyzedNews.filter(n => n.sentiment.label === 'negative').length;
  const neutralCount = analyzedNews.filter(n => n.sentiment.label === 'neutral').length;

  // Determine overall sentiment label
  let sentimentLabel: 'bullish' | 'bearish' | 'neutral';
  if (averageScore > 0.15) {
    sentimentLabel = 'bullish';
  } else if (averageScore < -0.15) {
    sentimentLabel = 'bearish';
  } else {
    sentimentLabel = 'neutral';
  }

  return {
    averageScore,
    sentimentLabel,
    positiveCount,
    negativeCount,
    neutralCount,
    totalCount: analyzedNews.length
  };
}

/**
 * Reset the request counter (call at start of new refresh session)
 */
export function resetRequestCount(): void {
  requestCount = 0;
}

/**
 * Get current request count (for monitoring)
 */
export function getRequestCount(): number {
  return requestCount;
}
