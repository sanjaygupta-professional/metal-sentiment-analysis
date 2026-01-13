import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    name: 'Metal Industry Sentiment Analysis API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      sentiment: {
        overview: 'GET /api/sentiment',
        byStock: 'GET /api/sentiment/[symbol]',
        refresh: 'POST /api/sentiment/refresh'
      },
      stocks: {
        all: 'GET /api/stocks',
        bySymbol: 'GET /api/stocks/[symbol]',
        correlation: 'GET /api/stocks/[symbol]/correlation'
      }
    }
  });
}
