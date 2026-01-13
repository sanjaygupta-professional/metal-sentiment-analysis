import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { SentimentDataPoint, StockPrice } from '../../types';
import { formatChartDate } from '../../utils/formatters';

interface CorrelationChartProps {
  sentimentData: SentimentDataPoint[];
  priceData: StockPrice[];
}

export default function CorrelationChart({
  sentimentData,
  priceData,
}: CorrelationChartProps) {
  if (!sentimentData?.length || !priceData?.length) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Insufficient data for correlation chart</p>
      </div>
    );
  }

  // Create a map of price data by date
  const priceByDate = new Map(priceData.map((p) => [p.date, p.changePercent]));

  // Merge data by date
  const mergedData = sentimentData
    .map((s) => ({
      date: formatChartDate(s.date),
      rawDate: s.date,
      sentiment: s.averageSentiment,
      priceChange: priceByDate.get(s.date) || null,
    }))
    .filter((d) => d.priceChange !== null);

  if (mergedData.length < 2) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">Not enough overlapping data</p>
          <p className="text-sm text-gray-400 mt-1">
            Need both sentiment and price data for same dates
          </p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              <span className="font-mono font-medium">
                {entry.name === 'Sentiment Score'
                  ? (entry.value >= 0 ? '+' : '') + entry.value.toFixed(3)
                  : (entry.value >= 0 ? '+' : '') + entry.value.toFixed(2) + '%'}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={mergedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
        />

        {/* Left Y-axis for Sentiment (-1 to +1) */}
        <YAxis
          yAxisId="left"
          domain={[-1, 1]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.toFixed(1)}
          tickLine={false}
          label={{
            value: 'Sentiment',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 11 },
          }}
        />

        {/* Right Y-axis for Price Change % */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value.toFixed(1)}%`}
          tickLine={false}
          label={{
            value: 'Price Change %',
            angle: 90,
            position: 'insideRight',
            style: { textAnchor: 'middle', fill: '#10b981', fontSize: 11 },
          }}
        />

        <Tooltip content={<CustomTooltip />} />
        <Legend />

        {/* Zero reference line */}
        <ReferenceLine yAxisId="left" y={0} stroke="#9ca3af" strokeDasharray="3 3" />

        {/* Price change bars */}
        <Bar
          yAxisId="right"
          dataKey="priceChange"
          fill="#10b981"
          opacity={0.6}
          name="Price Change %"
          radius={[2, 2, 0, 0]}
        />

        {/* Sentiment line */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="sentiment"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
          name="Sentiment Score"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
