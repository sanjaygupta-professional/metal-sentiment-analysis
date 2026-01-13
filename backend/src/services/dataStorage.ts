import fs from 'fs/promises';
import path from 'path';
import { SentimentHistory, StockPriceHistory, NewsCache, SentimentDataPoint } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');

/**
 * Ensure the data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Load sentiment history from JSON file
 */
export async function loadSentimentHistory(): Promise<SentimentHistory> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'sentiment-history.json');

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Return empty history if file doesn't exist
    return {
      lastUpdated: new Date().toISOString(),
      stocks: {}
    };
  }
}

/**
 * Save sentiment history to JSON file
 */
export async function saveSentimentHistory(data: SentimentHistory): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'sentiment-history.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Load stock price history from JSON file
 */
export async function loadStockPriceHistory(): Promise<StockPriceHistory> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'stock-prices.json');

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      lastUpdated: new Date().toISOString(),
      stocks: {}
    };
  }
}

/**
 * Save stock price history to JSON file
 */
export async function saveStockPriceHistory(data: StockPriceHistory): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'stock-prices.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Load news cache from JSON file
 */
export async function loadNewsCache(): Promise<NewsCache> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'news-cache.json');

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      lastUpdated: new Date().toISOString(),
      stocks: {}
    };
  }
}

/**
 * Save news cache to JSON file
 */
export async function saveNewsCache(data: NewsCache): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'news-cache.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Append a new sentiment data point for a stock
 * Keeps only the last 30 days of history
 */
export async function appendSentimentDataPoint(
  symbol: string,
  dataPoint: SentimentDataPoint
): Promise<void> {
  const history = await loadSentimentHistory();

  if (!history.stocks[symbol]) {
    history.stocks[symbol] = {
      currentSentiment: dataPoint,
      history: []
    };
  }

  // Update current sentiment
  history.stocks[symbol].currentSentiment = dataPoint;

  // Check if we already have data for today
  const today = dataPoint.date;
  const existingIndex = history.stocks[symbol].history.findIndex(
    h => h.date === today
  );

  if (existingIndex >= 0) {
    // Update existing entry for today
    history.stocks[symbol].history[existingIndex] = dataPoint;
  } else {
    // Add new entry
    history.stocks[symbol].history.push(dataPoint);
  }

  // Keep only last 30 days
  if (history.stocks[symbol].history.length > 30) {
    history.stocks[symbol].history = history.stocks[symbol].history.slice(-30);
  }

  history.lastUpdated = new Date().toISOString();
  await saveSentimentHistory(history);
}

/**
 * Get the data directory path (for verification)
 */
export function getDataDir(): string {
  return DATA_DIR;
}
