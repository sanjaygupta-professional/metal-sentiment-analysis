// Sentiment Types
export interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
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

// Stock Types
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

// News Types
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  stockSymbol: string;
  sentiment: SentimentResult;
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
  recentNews: NewsItem[];
}

export interface CorrelationData {
  symbol: string;
  period: string;
  correlation: number | null;
  correlationStrength?: string;
  dataPointsUsed?: number;
  sentimentData: SentimentDataPoint[];
  priceData: StockPrice[];
  message?: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  timestamp: string;
  processed: string[];
  errors?: string[];
  apiRequestsUsed: number;
}

// Sector type
export type Sector = 'steel' | 'aluminum' | 'mining' | 'coal';
