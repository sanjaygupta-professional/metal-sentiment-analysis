interface SentimentBadgeProps {
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  size?: 'sm' | 'md';
}

export default function SentimentBadge({
  label,
  confidence,
  size = 'sm',
}: SentimentBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const colorClasses = {
    positive: 'bg-green-100 text-green-700 border-green-200',
    negative: 'bg-red-100 text-red-700 border-red-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const labelText = {
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium
        ${sizeClasses[size]} ${colorClasses[label]}`}
    >
      {labelText[label]}
      <span className="opacity-60">
        {(confidence * 100).toFixed(0)}%
      </span>
    </span>
  );
}
