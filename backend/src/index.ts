import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import sentimentRoutes from './routes/sentiment';
import stocksRoutes from './routes/stocks';
import healthRoutes from './routes/health';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:3000',   // Alternative dev port
  process.env.FRONTEND_URL   // Production frontend URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/stocks', stocksRoutes);

// In production, serve the React frontend
if (isProduction) {
  // Serve static files from the frontend build directory
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Handle SPA routing - return index.html for non-API routes
  app.get('*', (req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
      });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Development: Root endpoint shows API info
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Metal Industry Sentiment Analysis API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        sentiment: {
          overview: 'GET /api/sentiment',
          byStock: 'GET /api/sentiment/:symbol',
          history: 'GET /api/sentiment/:symbol/history',
          refresh: 'POST /api/sentiment/refresh',
          status: 'GET /api/sentiment/status/info'
        },
        stocks: {
          all: 'GET /api/stocks',
          bySymbol: 'GET /api/stocks/:symbol',
          correlation: 'GET /api/stocks/:symbol/correlation',
          symbols: 'GET /api/stocks/list/symbols'
        }
      }
    });
  });

  // 404 handler for development
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      availableEndpoints: ['/api/health', '/api/sentiment', '/api/stocks']
    });
  });
}

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Metal Industry Sentiment Analysis API                  ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                               ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(40)}║
║                                                            ║
║  Endpoints:                                                ║
║    GET  /api/health              - Health check            ║
║    GET  /api/sentiment           - All stocks sentiment    ║
║    GET  /api/sentiment/:symbol   - Stock sentiment detail  ║
║    POST /api/sentiment/refresh   - Refresh sentiment data  ║
║    GET  /api/stocks              - All stock quotes        ║
║    GET  /api/stocks/:symbol      - Stock details           ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Export for Vercel serverless
export default app;
