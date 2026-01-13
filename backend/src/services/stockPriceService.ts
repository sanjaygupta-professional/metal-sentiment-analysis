import { StockQuote, StockPrice } from '../types';
import { METAL_STOCKS } from '../config/stocks';

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Helper function to create a delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch current stock quote from Yahoo Finance
 */
export async function fetchStockQuote(yahooSymbol: string): Promise<StockQuote | null> {
  try {
    const url = `${YAHOO_CHART_URL}/${yahooSymbol}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${yahooSymbol}: ${response.status}`);
      return null;
    }

    const data = await response.json() as { chart?: { result?: Array<{ meta: any; timestamp?: number[]; indicators?: { quote?: Array<any> } }> } };

    if (!data.chart?.result?.[0]) {
      console.error(`No data returned for ${yahooSymbol}`);
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;

    return {
      symbol: yahooSymbol,
      currentPrice: meta.regularMarketPrice || 0,
      previousClose: meta.previousClose || 0,
      changePercent: meta.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
        : 0,
      dayHigh: meta.regularMarketDayHigh || 0,
      dayLow: meta.regularMarketDayLow || 0,
      volume: meta.regularMarketVolume || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${yahooSymbol}:`, error);
    return null;
  }
}

/**
 * Fetch historical stock prices from Yahoo Finance
 */
export async function fetchHistoricalPrices(
  yahooSymbol: string,
  days: number = 30
): Promise<StockPrice[]> {
  try {
    // Yahoo Finance range options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    const range = days <= 5 ? '5d' : days <= 30 ? '1mo' : '3mo';
    const url = `${YAHOO_CHART_URL}/${yahooSymbol}?interval=1d&range=${range}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${yahooSymbol}: ${response.status}`);
      return [];
    }

    const data = await response.json() as { chart?: { result?: Array<{ meta: any; timestamp?: number[]; indicators?: { quote?: Array<any> } }> } };

    if (!data.chart?.result?.[0]) {
      console.error(`No historical data for ${yahooSymbol}`);
      return [];
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];

    if (!quote) {
      return [];
    }

    const prices: StockPrice[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      // Skip if data is null/undefined
      if (quote.close[i] == null) continue;

      const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
      const previousClose = i > 0 && quote.close[i - 1] != null
        ? quote.close[i - 1]
        : quote.open[i];

      prices.push({
        symbol: yahooSymbol,
        date,
        open: quote.open[i] || 0,
        high: quote.high[i] || 0,
        low: quote.low[i] || 0,
        close: quote.close[i] || 0,
        volume: quote.volume[i] || 0,
        changePercent: previousClose
          ? ((quote.close[i] - previousClose) / previousClose) * 100
          : 0
      });
    }

    // Return only the requested number of days
    return prices.slice(-days);
  } catch (error) {
    console.error(`Failed to fetch historical prices for ${yahooSymbol}:`, error);
    return [];
  }
}

/**
 * Fetch quotes for all metal stocks
 */
export async function fetchAllStockQuotes(): Promise<Map<string, StockQuote>> {
  const quotes = new Map<string, StockQuote>();

  console.log('Fetching stock quotes for all metal stocks...');

  for (let i = 0; i < METAL_STOCKS.length; i++) {
    const stock = METAL_STOCKS[i];

    try {
      const quote = await fetchStockQuote(stock.yahooSymbol);

      if (quote) {
        quotes.set(stock.symbol, quote);
        console.log(`Got quote for ${stock.shortName}: ₹${quote.currentPrice.toFixed(2)}`);
      }

      // Small delay to avoid rate limiting
      if (i < METAL_STOCKS.length - 1) {
        await delay(200);
      }
    } catch (error) {
      console.error(`Failed to fetch quote for ${stock.symbol}:`, error);
    }
  }

  return quotes;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);

  if (n < 2) {
    return 0;
  }

  const xSlice = x.slice(-n);
  const ySlice = y.slice(-n);

  const xMean = xSlice.reduce((a, b) => a + b, 0) / n;
  const yMean = ySlice.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xSlice[i] - xMean;
    const yDiff = ySlice[i] - yMean;
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xDenom * yDenom);

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}
