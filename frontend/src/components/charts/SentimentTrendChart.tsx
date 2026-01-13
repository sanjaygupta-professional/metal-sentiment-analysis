import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { SentimentDataPoint } from '../../types';
import { formatChartDate } from '../../utils/formatters';

interface SentimentTrendChartProps {
  data: SentimentDataPoint[];
}

export default function SentimentTrendChart({ data }: SentimentTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No historical data available</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatChartDate(d.date),
    sentiment: d.averageSentiment,
    newsCount: d.newsCount,
    label: d.sentimentLabel,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm mt-1">
            <span className="text-gray-500">Sentiment: </span>
            <span
              className={`font-mono font-bold ${
                data.sentiment > 0
                  ? 'text-green-600'
                  : data.sentiment < 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {data.sentiment >= 0 ? '+' : ''}
              {data.sentiment.toFixed(3)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">News Analyzed: </span>
            <span className="font-medium">{data.newsCount}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">Label: </span>
            <span
              className={`font-medium ${
                data.label === 'bullish'
                  ? 'text-green-600'
                  : data.label === 'bearish'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {data.label}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          domain={[-1, 1]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.toFixed(1)}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />

        {/* Reference line at zero */}
        <ReferenceLine
          y={0}
          stroke="#9ca3af"
          strokeDasharray="3 3"
          label={{ value: 'Neutral', position: 'right', fill: '#9ca3af', fontSize: 10 }}
        />

        {/* Bullish threshold */}
        <ReferenceLine
          y={0.15}
          stroke="#22c55e"
          strokeDasharray="2 2"
          strokeOpacity={0.5}
        />

        {/* Bearish threshold */}
        <ReferenceLine
          y={-0.15}
          stroke="#ef4444"
          strokeDasharray="2 2"
          strokeOpacity={0.5}
        />

        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6, fill: '#2563eb' }}
          name="Sentiment Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
