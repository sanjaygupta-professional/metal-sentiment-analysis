// Stock Configuration Types
export interface StockConfig {
  symbol: string;           // NSE symbol
  name: string;             // Full company name
  shortName: string;        // Display name
  yahooSymbol: string;      // Yahoo Finance symbol (NSE suffix)
  searchTerms: string[];    // Google News search terms
  sector: 'steel' | 'aluminum' | 'mining' | 'coal';
}

// News Types
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  stockSymbol: string;
}

// Sentiment Types
export interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  score: number;        // -1 to +1 scale
  confidence: number;   // 0 to 1
}

export interface AnalyzedNews {
  newsId: string;
  title: string;
  sentiment: SentimentResult;
  analyzedAt: string;
}

export interface SentimentDataPoint {
  date: string;
  stockSymbol: string;
  averageSentiment: number;
  sentimentLabel: 'bullish' | 'bearish' | 'neutral';
  newsCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topPositiveNews: string[];
  topNegativeNews: string[];
}

// Stock Price Types
export interface StockQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  timestamp: string;
}

export interface StockPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePercent: number;
}

// Storage Types
export interface SentimentHistory {
  lastUpdated: string;
  stocks: {
    [symbol: string]: {
      currentSentiment: SentimentDataPoint;
      history: SentimentDataPoint[];
    };
  };
}

export interface StockPriceHistory {
  lastUpdated: string;
  stocks: {
    [symbol: string]: {
      currentQuote: StockQuote;
      history: StockPrice[];
    };
  };
}

export interface NewsCache {
  lastUpdated: string;
  stocks: {
    [symbol: string]: {
      news: Array<NewsItem & { sentiment: SentimentResult }>;
    };
  };
}

// API Response Types
export interface StockSentimentOverview {
  symbol: string;
  name: string;
  sector: string;
  sentiment: SentimentDataPoint | null;
  lastUpdated: string;
}

export interface StockSentimentDetail {
  symbol: string;
  currentSentiment: SentimentDataPoint | null;
  history: SentimentDataPoint[];
  recentNews: Array<NewsItem & { sentiment: SentimentResult }>;
}

export interface CorrelationData {
  symbol: string;
  period: string;
  correlation: number | null;
  sentimentData: SentimentDataPoint[];
  priceData: StockPrice[];
  message?: string;
}
