import { Router, Request, Response } from 'express';
import { METAL_STOCKS, getStockBySymbol } from '../config/stocks';
import {
  fetchStockQuote,
  fetchHistoricalPrices,
  fetchAllStockQuotes,
  calculateCorrelation
} from '../services/stockPriceService';
import { loadSentimentHistory } from '../services/dataStorage';

const router = Router();

/**
 * GET /api/stocks
 * Get current quotes for all metal stocks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const quotes = await fetchAllStockQuotes();

    const response = METAL_STOCKS.map(stock => ({
      symbol: stock.symbol,
      name: stock.shortName,
      fullName: stock.name,
      sector: stock.sector,
      quote: quotes.get(stock.symbol) || null
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

/**
 * GET /api/stocks/:symbol
 * Get detailed information for a specific stock
 */
router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = getStockBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const [quote, history] = await Promise.all([
      fetchStockQuote(stock.yahooSymbol),
      fetchHistoricalPrices(stock.yahooSymbol, 30)
    ]);

    res.json({
      symbol: stock.symbol,
      name: stock.name,
      shortName: stock.shortName,
      sector: stock.sector,
      yahooSymbol: stock.yahooSymbol,
      quote,
      priceHistory: history
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

/**
 * GET /api/stocks/:symbol/correlation
 * Calculate correlation between sentiment and stock price changes
 */
router.get('/:symbol/correlation', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { period = '30' } = req.query;
    const periodDays = parseInt(period as string, 10);

    const stock = getStockBySymbol(symbol);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Load sentiment history
    const sentimentHistory = await loadSentimentHistory();
    const stockSentiment = sentimentHistory.stocks[symbol];

    // Fetch price history
    const priceHistory = await fetchHistoricalPrices(stock.yahooSymbol, periodDays);

    // Check if we have enough data
    if (!stockSentiment || stockSentiment.history.length < 5) {
      return res.json({
        symbol,
        period: `${periodDays}d`,
        correlation: null,
        message: 'Insufficient sentiment data for correlation analysis. Need at least 5 days.',
        sentimentData: stockSentiment?.history || [],
        priceData: priceHistory
      });
    }

    if (priceHistory.length < 5) {
      return res.json({
        symbol,
        period: `${periodDays}d`,
        correlation: null,
        message: 'Insufficient price data for correlation analysis.',
        sentimentData: stockSentiment.history,
        priceData: priceHistory
      });
    }

    // Align data by date
    const sentimentByDate = new Map(
      stockSentiment.history.map(s => [s.date, s.averageSentiment])
    );
    const priceByDate = new Map(
      priceHistory.map(p => [p.date, p.changePercent])
    );

    // Find common dates
    const commonDates = Array.from(sentimentByDate.keys()).filter(
      date => priceByDate.has(date)
    );

    if (commonDates.length < 5) {
      return res.json({
        symbol,
        period: `${periodDays}d`,
        correlation: null,
        message: `Only ${commonDates.length} days of overlapping data. Need at least 5 days.`,
        sentimentData: stockSentiment.history,
        priceData: priceHistory
      });
    }

    // Extract aligned values
    const sentimentValues = commonDates.map(d => sentimentByDate.get(d)!);
    const priceValues = commonDates.map(d => priceByDate.get(d)!);

    // Calculate correlation
    const correlation = calculateCorrelation(sentimentValues, priceValues);

    res.json({
      symbol,
      period: `${periodDays}d`,
      correlation,
      correlationStrength: getCorrelationStrength(correlation),
      dataPointsUsed: commonDates.length,
      sentimentData: stockSentiment.history.slice(-periodDays),
      priceData: priceHistory
    });
  } catch (error) {
    console.error('Error calculating correlation:', error);
    res.status(500).json({ error: 'Failed to calculate correlation' });
  }
});

/**
 * Get human-readable correlation strength
 */
function getCorrelationStrength(correlation: number): string {
  const absCorr = Math.abs(correlation);
  if (absCorr >= 0.7) return 'strong';
  if (absCorr >= 0.4) return 'moderate';
  if (absCorr >= 0.2) return 'weak';
  return 'negligible';
}

/**
 * GET /api/stocks/list/symbols
 * Get list of all tracked stock symbols
 */
router.get('/list/symbols', (req: Request, res: Response) => {
  res.json(METAL_STOCKS.map(s => ({
    symbol: s.symbol,
    name: s.shortName,
    sector: s.sector
  })));
});

export default router;
