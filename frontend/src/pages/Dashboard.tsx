import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, BarChart3 } from 'lucide-react';
import StockOverviewGrid from '../components/dashboard/StockOverviewGrid';
import RefreshButton from '../components/common/RefreshButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getSentimentOverview, refreshSentiment } from '../services/api';
import { StockSentimentOverview } from '../types';
import { formatDate } from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<StockSentimentOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSentimentOverview();
      setStocks(data);
      if (data.length > 0 && data[0].lastUpdated) {
        setLastUpdated(data[0].lastUpdated);
      }
    } catch (err) {
      setError('Failed to load sentiment data. Please try again.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      setRefreshMessage('Fetching news and analyzing sentiment... This takes 2-3 minutes.');

      const result = await refreshSentiment();

      setRefreshMessage(null);

      if (result.success) {
        // Reload data after refresh
        await loadData();

        // Show success message briefly
        setRefreshMessage(
          `Successfully analyzed ${result.processed.length} stocks (${result.apiRequestsUsed} API calls used)`
        );
        setTimeout(() => setRefreshMessage(null), 5000);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to refresh data. Please check your API key configuration.';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The server may still be processing - try refreshing the page in a minute.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check if the backend server is running on port 3001.';
      }

      setError(errorMessage);
      setRefreshMessage(null);
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate summary stats
  const summaryStats = {
    total: stocks.length,
    bullish: stocks.filter((s) => s.sentiment?.sentimentLabel === 'bullish').length,
    bearish: stocks.filter((s) => s.sentiment?.sentimentLabel === 'bearish').length,
    neutral: stocks.filter((s) => s.sentiment?.sentimentLabel === 'neutral').length,
    noData: stocks.filter((s) => !s.sentiment).length,
  };

  if (loading) {
    return <LoadingSpinner message="Loading sentiment data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Metal Industry Sentiment
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time sentiment analysis for Indian metal stocks
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last updated: {formatDate(lastUpdated)}
            </p>
          )}
        </div>
        <RefreshButton onClick={handleRefresh} loading={refreshing} />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Refresh Message */}
      {refreshMessage && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
          {refreshing ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{refreshMessage}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Total Stocks</p>
          <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600">Bullish</p>
          <p className="text-2xl font-bold text-green-700">{summaryStats.bullish}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-600">Bearish</p>
          <p className="text-2xl font-bold text-red-700">{summaryStats.bearish}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Neutral</p>
          <p className="text-2xl font-bold text-gray-700">{summaryStats.neutral}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-600">No Data</p>
          <p className="text-2xl font-bold text-yellow-700">{summaryStats.noData}</p>
        </div>
      </div>

      {/* Stocks Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Stock Sentiment Overview
        </h2>
        <StockOverviewGrid
          stocks={stocks}
          onStockClick={(symbol) => navigate(`/stock/${symbol}`)}
        />
      </div>

      {/* Instructions for first-time users */}
      {summaryStats.noData === summaryStats.total && (
        <div className="text-center py-8 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900">Welcome!</h3>
          <p className="text-blue-700 mt-2">
            Click the "Refresh Data" button to fetch news and analyze sentiment.
          </p>
          <p className="text-sm text-blue-600 mt-1">
            This may take 1-2 minutes as we analyze news for all 7 metal stocks.
          </p>
        </div>
      )}
    </div>
  );
}
