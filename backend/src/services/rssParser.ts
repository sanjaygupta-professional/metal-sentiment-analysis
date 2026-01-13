import Parser from 'rss-parser';
import crypto from 'crypto';
import { NewsItem, StockConfig } from '../types';
import { METAL_STOCKS } from '../config/stocks';

const parser = new Parser({
  customFields: {
    item: [['source', 'source']]
  },
  timeout: 10000 // 10 second timeout
});

/**
 * Helper function to create a delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID for a news item
 */
function generateNewsId(link: string, pubDate: string): string {
  return crypto.createHash('md5').update(`${link}${pubDate}`).digest('hex');
}

/**
 * Clean the title by removing source suffix
 * Google News appends " - Source Name" to titles
 */
function cleanTitle(title: string): string {
  return title.replace(/\s*-\s*[^-]+$/, '').trim();
}

/**
 * Extract source name from title
 */
function extractSource(title: string): string {
  const match = title.match(/\s*-\s*([^-]+)$/);
  return match ? match[1].trim() : 'Unknown';
}

/**
 * Clean description by removing HTML tags
 */
function cleanDescription(desc: string): string {
  return desc
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/&nbsp;/g, ' ')   // Replace nbsp
    .replace(/&amp;/g, '&')    // Replace amp
    .replace(/&quot;/g, '"')   // Replace quotes
    .replace(/&#39;/g, "'")    // Replace apostrophe
    .trim()
    .slice(0, 500);            // Limit length
}

/**
 * Build Google News RSS URL for a search term
 */
function buildRssUrl(searchTerm: string): string {
  const encodedTerm = encodeURIComponent(`${searchTerm} stock India`);
  return `https://news.google.com/rss/search?q=${encodedTerm}&hl=en-IN&gl=IN&ceid=IN:en`;
}

/**
 * Fetch news for a single stock from Google News RSS
 */
export async function fetchNewsForStock(stock: StockConfig): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  for (const searchTerm of stock.searchTerms) {
    const feedUrl = buildRssUrl(searchTerm);

    try {
      const feed = await parser.parseURL(feedUrl);

      const newsItems = feed.items.map(item => ({
        id: generateNewsId(item.link || '', item.pubDate || ''),
        title: cleanTitle(item.title || ''),
        description: cleanDescription(item.contentSnippet || item.content || ''),
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        source: extractSource(item.title || ''),
        stockSymbol: stock.symbol
      }));

      allNews.push(...newsItems);

      // Small delay between search terms to avoid rate limiting
      await delay(300);
    } catch (error) {
      console.error(`Failed to fetch news for "${searchTerm}":`, error);
    }
  }

  // Deduplicate by ID (same article may appear for different search terms)
  const uniqueNews = Array.from(
    new Map(allNews.map(item => [item.id, item])).values()
  );

  // Sort by publication date (newest first)
  return uniqueNews.sort((a, b) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

/**
 * Fetch news for all metal stocks
 * Returns a Map with stock symbol as key and news array as value
 */
export async function fetchAllStocksNews(): Promise<Map<string, NewsItem[]>> {
  const newsMap = new Map<string, NewsItem[]>();

  console.log('Fetching news for all metal stocks...');

  for (let i = 0; i < METAL_STOCKS.length; i++) {
    const stock = METAL_STOCKS[i];
    console.log(`Fetching news for ${stock.shortName} (${i + 1}/${METAL_STOCKS.length})...`);

    try {
      const news = await fetchNewsForStock(stock);
      newsMap.set(stock.symbol, news);
      console.log(`Found ${news.length} news items for ${stock.shortName}`);

      // Delay between stocks to avoid rate limiting
      if (i < METAL_STOCKS.length - 1) {
        await delay(500);
      }
    } catch (error) {
      console.error(`Failed to fetch news for ${stock.symbol}:`, error);
      newsMap.set(stock.symbol, []);
    }
  }

  return newsMap;
}

/**
 * Filter news items to only include recent ones (last 7 days)
 */
export function filterRecentNews(news: NewsItem[], days: number = 7): NewsItem[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return news.filter(item => new Date(item.pubDate) >= cutoffDate);
}
