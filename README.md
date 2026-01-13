# Metal Industry Sentiment Analysis

Real-time sentiment analysis dashboard for Indian metal stocks using AI-powered news analysis.

## Features

- **7 Metal Stocks Tracked**: Tata Steel, JSW Steel, Hindalco, Vedanta, SAIL, NMDC, Coal India
- **AI Sentiment Analysis**: Uses FinBERT model for financial news sentiment classification
- **Historical Data**: View sentiment trends over time
- **Price Correlation**: Compare sentiment with stock price movements

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI Model**: FinBERT via HuggingFace Inference API
- **Data Source**: Google News RSS feeds

## Setup

### Prerequisites
- Node.js 18+
- HuggingFace API Key (free at https://huggingface.co/settings/tokens)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example backend/.env

# Add your HuggingFace API key to backend/.env
# HUGGINGFACE_API_KEY=your_key_here

# Start development servers
npm run dev
```

### Environment Variables

Create `backend/.env` with:
```
HUGGINGFACE_API_KEY=your_huggingface_api_key
PORT=3001
NODE_ENV=development
```

## Deployment

This app is configured for Railway deployment:

1. Push to GitHub
2. Connect repository to Railway
3. Add `HUGGINGFACE_API_KEY` environment variable
4. Deploy!

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/sentiment | All stocks sentiment overview |
| GET /api/sentiment/:symbol | Stock sentiment detail |
| POST /api/sentiment/refresh | Refresh sentiment data |
| GET /api/stocks | All stock quotes |

## License

MIT
