import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export default function RefreshButton({
  onClick,
  loading,
  disabled = false,
}: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg
        hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="font-medium">
        {loading ? 'Refreshing...' : 'Refresh Data'}
      </span>
    </button>
  );
}
