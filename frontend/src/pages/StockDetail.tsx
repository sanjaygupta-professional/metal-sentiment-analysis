import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Newspaper, BarChart2, Activity } from 'lucide-react';
import SentimentTrendChart from '../components/charts/SentimentTrendChart';
import CorrelationChart from '../components/charts/CorrelationChart';
import NewsList from '../components/news/NewsList';
import SentimentGauge from '../components/dashboard/SentimentGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getStockSentiment, getStockCorrelation } from '../services/api';
import { StockSentimentDetail, CorrelationData } from '../types';

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StockSentimentDetail | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbol) {
      loadData(symbol);
    }
  }, [symbol]);

  const loadData = async (sym: string) => {
    try {
      setLoading(true);
      setError(null);

      const [sentimentData, correlationData] = await Promise.all([
        getStockSentiment(sym),
        getStockCorrelation(sym).catch(() => null), // Don't fail if correlation fails
      ]);

      setData(sentimentData);
      setCorrelation(correlationData);
    } catch (err) {
      setError('Failed to load stock details');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading stock analysis..." />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Stock not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const hasData = data.currentSentiment !== null;

  return (
    <div className="space-y-6">
      {/* Back Button & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{symbol}</h1>
          <p className="text-gray-500">Sentiment Analysis</p>
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No Sentiment Data</h3>
          <p className="text-gray-500 mt-1">
            Go back to the dashboard and click "Refresh Data" to analyze this stock.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Current Sentiment Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Current Sentiment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gauge */}
              <div className="flex justify-center">
                <SentimentGauge
                  score={data.currentSentiment!.averageSentiment}
                  label={data.currentSentiment!.sentimentLabel}
                />
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">News Analyzed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.currentSentiment!.newsCount}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {data.currentSentiment!.positiveCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 flex items-center justify-center text-gray-400">
                      •
                    </span>
                    <span className="text-gray-600 font-medium">
                      {data.currentSentiment!.neutralCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {data.currentSentiment!.negativeCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Correlation */}
              {correlation && correlation.correlation !== null && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Price Correlation ({correlation.period})
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      correlation.correlation > 0
                        ? 'text-green-600'
                        : correlation.correlation < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {(correlation.correlation * 100).toFixed(1)}%
                  </p>
                  {correlation.correlationStrength && (
                    <p className="text-sm text-gray-500 capitalize">
                      {correlation.correlationStrength} correlation
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Top Headlines */}
            {(data.currentSentiment!.topPositiveNews.length > 0 ||
              data.currentSentiment!.topNegativeNews.length > 0) && (
              <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Positive */}
                {data.currentSentiment!.topPositiveNews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Top Positive Headlines
                    </h4>
                    <ul className="space-y-2">
                      {data.currentSentiment!.topPositiveNews.map((headline, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 pl-3 border-l-2 border-green-200"
                        >
                          {headline}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Top Negative */}
                {data.currentSentiment!.topNegativeNews.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      Top Negative Headlines
                    </h4>
                    <ul className="space-y-2">
                      {data.currentSentiment!.topNegativeNews.map((headline, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 pl-3 border-l-2 border-red-200"
                        >
                          {headline}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Trend */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                Sentiment Trend
              </h2>
              <SentimentTrendChart data={data.history} />
            </div>

            {/* Correlation Chart */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Sentiment vs Price
              </h2>
              {correlation ? (
                <CorrelationChart
                  sentimentData={correlation.sentimentData}
                  priceData={correlation.priceData}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Correlation data not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent News */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-purple-600" />
              Recent News
            </h2>
            <NewsList news={data.recentNews} />
          </div>
        </>
      )}
    </div>
  );
}
