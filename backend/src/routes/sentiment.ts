import { Router, Request, Response } from 'express';
import { METAL_STOCKS } from '../config/stocks';
import { fetchAllStocksNews, filterRecentNews } from '../services/rssParser';
import {
  analyzeNewsItems,
  calculateAggregateSentiment,
  resetRequestCount,
  getRequestCount
} from '../services/sentimentAnalyzer';
import {
  loadSentimentHistory,
  loadNewsCache,
  saveNewsCache,
  appendSentimentDataPoint
} from '../services/dataStorage';
import { StockSentimentOverview, SentimentDataPoint, NewsItem, SentimentResult } from '../types';

const router = Router();

/**
 * GET /api/sentiment
 * Get current sentiment overview for all stocks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const history = await loadSentimentHistory();

    const response: StockSentimentOverview[] = METAL_STOCKS.map(stock => ({
      symbol: stock.symbol,
      name: stock.shortName,
      sector: stock.sector,
      sentiment: history.stocks[stock.symbol]?.currentSentiment || null,
      lastUpdated: history.lastUpdated
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching sentiment overview:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment data' });
  }
});

/**
 * GET /api/sentiment/:symbol
 * Get detailed sentiment for a specific stock
 */
router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const history = await loadSentimentHistory();
    const newsCache = await loadNewsCache();

    const stockData = history.stocks[symbol];
    const newsData = newsCache.stocks[symbol];

    if (!stockData) {
      return res.json({
        symbol,
        currentSentiment: null,
        history: [],
        recentNews: []
      });
    }

    res.json({
      symbol,
      currentSentiment: stockData.currentSentiment,
      history: stockData.history,
      recentNews: newsData?.news?.slice(0, 15) || []
    });
  } catch (error) {
    console.error('Error fetching stock sentiment:', error);
    res.status(500).json({ error: 'Failed to fetch stock sentiment' });
  }
});

/**
 * GET /api/sentiment/:symbol/history
 * Get historical sentiment data for a stock
 */
router.get('/:symbol/history', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { days = '30' } = req.query;

    const history = await loadSentimentHistory();
    const stockData = history.stocks[symbol];

    if (!stockData) {
      return res.json({
        symbol,
        history: []
      });
    }

    const daysNum = parseInt(days as string, 10);
    const filteredHistory = stockData.history.slice(-daysNum);

    res.json({
      symbol,
      history: filteredHistory
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * Helper function to group news by publication date
 */
function groupNewsByDate(news: NewsItem[]): Map<string, NewsItem[]> {
  const grouped = new Map<string, NewsItem[]>();

  for (const item of news) {
    const date = new Date(item.pubDate).toISOString().split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(item);
  }

  return grouped;
}

/**
 * POST /api/sentiment/refresh
 * Trigger data refresh - fetch news and analyze sentiment
 * Now groups news by date to build historical sentiment data
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'HuggingFace API key not configured',
        message: 'Please set HUGGINGFACE_API_KEY environment variable'
      });
    }

    console.log('Starting sentiment refresh with historical backfill...');

    // Reset rate limiter for new session
    resetRequestCount();

    // Fetch news for all stocks
    const allNews = await fetchAllStocksNews();
    const newsCache = await loadNewsCache();

    const processedStocks: string[] = [];
    const errors: string[] = [];
    let totalDatesProcessed = 0;
    let skippedDates = 0;

    // Load existing history to skip already processed dates
    const existingHistory = await loadSentimentHistory();

    // Process each stock
    for (const stock of METAL_STOCKS) {
      try {
        const rawNews = allNews.get(stock.symbol) || [];

        // Filter to recent news only (last 7 days)
        const recentNews = filterRecentNews(rawNews, 7);

        if (recentNews.length === 0) {
          console.log(`No recent news found for ${stock.shortName}`);
          continue;
        }

        // Group news by publication date
        const newsByDate = groupNewsByDate(recentNews);

        // Get existing dates for this stock
        const existingDates = new Set(
          existingHistory.stocks[stock.symbol]?.history.map(h => h.date) || []
        );

        console.log(`${stock.shortName}: Found news for ${newsByDate.size} dates (${existingDates.size} already processed)`);

        // Process each date's news separately
        for (const [date, dateNews] of newsByDate) {
          // Skip if we already have data for this date (except today - always refresh today)
          const today = new Date().toISOString().split('T')[0];
          if (existingDates.has(date) && date !== today) {
            skippedDates++;
            continue;
          }

          // Limit to top 5 news items per day for API efficiency
          const newsToAnalyze = dateNews.slice(0, 5);
          const analyzed = await analyzeNewsItems(newsToAnalyze, apiKey);

          // Calculate aggregate sentiment for this date
          const aggregate = calculateAggregateSentiment(analyzed);

          // Get top positive and negative headlines
          const topPositive = analyzed
            .filter(n => n.sentiment.label === 'positive')
            .sort((a, b) => b.sentiment.confidence - a.sentiment.confidence)
            .slice(0, 3)
            .map(n => n.title);

          const topNegative = analyzed
            .filter(n => n.sentiment.label === 'negative')
            .sort((a, b) => b.sentiment.confidence - a.sentiment.confidence)
            .slice(0, 3)
            .map(n => n.title);

          // Create sentiment data point for this specific date
          const dataPoint: SentimentDataPoint = {
            date: date,
            stockSymbol: stock.symbol,
            averageSentiment: aggregate.averageScore,
            sentimentLabel: aggregate.sentimentLabel,
            newsCount: aggregate.totalCount,
            positiveCount: aggregate.positiveCount,
            negativeCount: aggregate.negativeCount,
            neutralCount: aggregate.neutralCount,
            topPositiveNews: topPositive,
            topNegativeNews: topNegative
          };

          // Save to history with the actual date
          await appendSentimentDataPoint(stock.symbol, dataPoint);
          totalDatesProcessed++;

          console.log(`  ${date}: ${aggregate.sentimentLabel} (score: ${aggregate.averageScore.toFixed(3)}, news: ${aggregate.totalCount})`);
        }

        // Update news cache with sentiment (use all recent news)
        const allAnalyzed = await analyzeNewsItems(recentNews.slice(0, 15), apiKey);
        const newsWithSentiment: Array<NewsItem & { sentiment: SentimentResult }> =
          recentNews.slice(0, 20).map((news, index) => ({
            ...news,
            sentiment: allAnalyzed[index]?.sentiment || { label: 'neutral', score: 0, confidence: 0 }
          }));

        newsCache.stocks[stock.symbol] = { news: newsWithSentiment };
        processedStocks.push(stock.symbol);

      } catch (stockError) {
        console.error(`Error processing ${stock.symbol}:`, stockError);
        errors.push(stock.symbol);
      }
    }

    // Save updated news cache
    newsCache.lastUpdated = new Date().toISOString();
    await saveNewsCache(newsCache);

    console.log(`Refresh complete. Dates processed: ${totalDatesProcessed}, skipped: ${skippedDates}, API requests used: ${getRequestCount()}`);

    res.json({
      success: true,
      message: 'Sentiment data refreshed with historical backfill',
      timestamp: new Date().toISOString(),
      processed: processedStocks,
      datesProcessed: totalDatesProcessed,
      datesSkipped: skippedDates,
      errors: errors.length > 0 ? errors : undefined,
      apiRequestsUsed: getRequestCount()
    });
  } catch (error) {
    console.error('Refresh failed:', error);
    res.status(500).json({
      error: 'Failed to refresh sentiment data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sentiment/status
 * Get current refresh status and API usage
 */
router.get('/status/info', async (req: Request, res: Response) => {
  try {
    const history = await loadSentimentHistory();

    const stocksWithData = Object.keys(history.stocks).length;
    const lastUpdated = history.lastUpdated;

    res.json({
      stocksTracked: METAL_STOCKS.length,
      stocksWithData,
      lastUpdated,
      apiRequestsThisSession: getRequestCount()
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
