import { StockConfig } from '../types';

/**
 * Configuration for 7 major Indian Metal industry stocks
 * These stocks are part of the Nifty Metal index
 */
export const METAL_STOCKS: StockConfig[] = [
  {
    symbol: 'TATASTEEL',
    name: 'Tata Steel Limited',
    shortName: 'Tata Steel',
    yahooSymbol: 'TATASTEEL.NS',
    searchTerms: ['Tata Steel', 'TATASTEEL', 'Tata Steel India'],
    sector: 'steel'
  },
  {
    symbol: 'JSWSTEEL',
    name: 'JSW Steel Limited',
    shortName: 'JSW Steel',
    yahooSymbol: 'JSWSTEEL.NS',
    searchTerms: ['JSW Steel', 'JSWSTEEL', 'JSW Steel India'],
    sector: 'steel'
  },
  {
    symbol: 'HINDALCO',
    name: 'Hindalco Industries Limited',
    shortName: 'Hindalco',
    yahooSymbol: 'HINDALCO.NS',
    searchTerms: ['Hindalco', 'Hindalco Industries', 'Novelis'],
    sector: 'aluminum'
  },
  {
    symbol: 'VEDL',
    name: 'Vedanta Limited',
    shortName: 'Vedanta',
    yahooSymbol: 'VEDL.NS',
    searchTerms: ['Vedanta Limited', 'VEDL', 'Vedanta India metals'],
    sector: 'mining'
  },
  {
    symbol: 'SAIL',
    name: 'Steel Authority of India Limited',
    shortName: 'SAIL',
    yahooSymbol: 'SAIL.NS',
    searchTerms: ['SAIL', 'Steel Authority of India', 'SAIL India steel'],
    sector: 'steel'
  },
  {
    symbol: 'NMDC',
    name: 'NMDC Limited',
    shortName: 'NMDC',
    yahooSymbol: 'NMDC.NS',
    searchTerms: ['NMDC', 'NMDC Limited', 'NMDC India iron ore'],
    sector: 'mining'
  },
  {
    symbol: 'COALINDIA',
    name: 'Coal India Limited',
    shortName: 'Coal India',
    yahooSymbol: 'COALINDIA.NS',
    searchTerms: ['Coal India', 'COALINDIA', 'Coal India Limited'],
    sector: 'coal'
  }
];

/**
 * Get stock configuration by symbol
 */
export function getStockBySymbol(symbol: string): StockConfig | undefined {
  return METAL_STOCKS.find(stock => stock.symbol === symbol);
}

/**
 * Get all stock symbols
 */
export function getAllSymbols(): string[] {
  return METAL_STOCKS.map(stock => stock.symbol);
}
