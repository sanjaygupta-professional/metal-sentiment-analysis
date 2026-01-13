import axios from 'axios';
import {
  StockSentimentOverview,
  StockSentimentDetail,
  CorrelationData,
  RefreshResponse,
} from '../types';

// API base URL - uses proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for sentiment refresh
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Get sentiment overview for all metal stocks
 */
export async function getSentimentOverview(): Promise<StockSentimentOverview[]> {
  const response = await api.get<StockSentimentOverview[]>('/sentiment');
  return response.data;
}

/**
 * Get detailed sentiment for a specific stock
 */
export async function getStockSentiment(symbol: string): Promise<StockSentimentDetail> {
  const response = await api.get<StockSentimentDetail>(`/sentiment/${symbol}`);
  return response.data;
}

/**
 * Get sentiment history for a stock
 */
export async function getSentimentHistory(
  symbol: string,
  days: number = 30
): Promise<{ symbol: string; history: StockSentimentDetail['history'] }> {
  const response = await api.get(`/sentiment/${symbol}/history`, {
    params: { days },
  });
  return response.data;
}

/**
 * Trigger sentiment data refresh
 * Note: This can take 2-3 minutes as it analyzes news for all stocks
 * using the HuggingFace API with rate limiting (1 request/second)
 */
export async function refreshSentiment(): Promise<RefreshResponse> {
  const response = await api.post<RefreshResponse>('/sentiment/refresh', {}, {
    timeout: 300000, // 5 minutes timeout for the full refresh operation
  });
  return response.data;
}

/**
 * Get correlation data between sentiment and stock price
 */
export async function getStockCorrelation(
  symbol: string,
  period: number = 30
): Promise<CorrelationData> {
  const response = await api.get<CorrelationData>(`/stocks/${symbol}/correlation`, {
    params: { period },
  });
  return response.data;
}

/**
 * Get stock quote and price history
 */
export async function getStockDetails(symbol: string): Promise<{
  symbol: string;
  name: string;
  shortName: string;
  sector: string;
  quote: any;
  priceHistory: any[];
}> {
  const response = await api.get(`/stocks/${symbol}`);
  return response.data;
}

/**
 * Get all stock quotes
 */
export async function getAllStocks(): Promise<any[]> {
  const response = await api.get('/stocks');
  return response.data;
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{
  status: string;
  service: string;
  version: string;
  timestamp: string;
}> {
  const response = await api.get('/health');
  return response.data;
}

export default api;
