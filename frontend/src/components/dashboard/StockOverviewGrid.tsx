import { TrendingUp, TrendingDown, Minus, Newspaper, ArrowRight } from 'lucide-react';
import { StockSentimentOverview } from '../../types';
import { getSentimentColor, getSectorName, formatSentimentScore } from '../../utils/formatters';

interface StockOverviewGridProps {
  stocks: StockSentimentOverview[];
  onStockClick: (symbol: string) => void;
}

export default function StockOverviewGrid({ stocks, onStockClick }: StockOverviewGridProps) {
  const getSentimentIcon = (label: string | undefined) => {
    switch (label) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-500">No stocks to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stocks.map((stock) => {
        const colors = getSentimentColor(stock.sentiment?.sentimentLabel);

        return (
          <button
            key={stock.symbol}
            onClick={() => onStockClick(stock.symbol)}
            className={`p-5 rounded-xl border-2 ${colors.border} ${colors.bg}
              hover:shadow-lg transition-all duration-200 text-left group
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{stock.symbol}</h3>
                <p className="text-sm text-gray-500">{stock.name}</p>
              </div>
              {getSentimentIcon(stock.sentiment?.sentimentLabel)}
            </div>

            {/* Sector Badge */}
            <div className="mb-3">
              <span className="text-xs px-2 py-1 bg-white/50 rounded-full text-gray-600">
                {getSectorName(stock.sector)}
              </span>
            </div>

            {/* Sentiment Data */}
            {stock.sentiment ? (
              <div className="space-y-3">
                {/* Score */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Sentiment Score</span>
                  <span
                    className={`font-mono font-bold ${
                      stock.sentiment.averageSentiment > 0
                        ? 'text-green-600'
                        : stock.sentiment.averageSentiment < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatSentimentScore(stock.sentiment.averageSentiment)}
                  </span>
                </div>

                {/* News Count */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Newspaper className="w-3.5 h-3.5" />
                    News Analyzed
                  </span>
                  <span className="font-medium">{stock.sentiment.newsCount}</span>
                </div>

                {/* Sentiment Distribution */}
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    +{stock.sentiment.positiveCount}
                  </span>
                  <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {stock.sentiment.neutralCount}
                  </span>
                  <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    -{stock.sentiment.negativeCount}
                  </span>
                </div>

                {/* Sentiment Label */}
                <div className="pt-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                      stock.sentiment.sentimentLabel === 'bullish'
                        ? 'bg-green-200 text-green-800'
                        : stock.sentiment.sentimentLabel === 'bearish'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {stock.sentiment.sentimentLabel.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-sm text-gray-400">No sentiment data</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click "Refresh Data" to analyze
                </p>
              </div>
            )}

            {/* View Details */}
            <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center justify-between text-sm text-blue-600 group-hover:text-blue-700">
              <span>View Details</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
