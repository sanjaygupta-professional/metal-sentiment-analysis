interface SentimentGaugeProps {
  score: number;  // -1 to +1
  label: 'bullish' | 'bearish' | 'neutral';
}

export default function SentimentGauge({ score, label }: SentimentGaugeProps) {
  // Calculate rotation for needle (-90 to +90 degrees)
  const rotation = (score * 90);

  const getGaugeColor = () => {
    if (label === 'bullish') return 'text-green-600';
    if (label === 'bearish') return 'text-red-600';
    return 'text-gray-600';
  };

  const getLabelBadge = () => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-semibold';
    if (label === 'bullish') {
      return `${baseClasses} bg-green-100 text-green-700`;
    }
    if (label === 'bearish') {
      return `${baseClasses} bg-red-100 text-red-700`;
    }
    return `${baseClasses} bg-gray-100 text-gray-700`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Gauge SVG */}
      <div className="relative w-40 h-24">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Colored segments */}
          {/* Red (bearish) segment */}
          <path
            d="M 10 50 A 40 40 0 0 1 30 17"
            fill="none"
            stroke="#fecaca"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Yellow (neutral) segment */}
          <path
            d="M 30 17 A 40 40 0 0 1 70 17"
            fill="none"
            stroke="#fef3c7"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Green (bullish) segment */}
          <path
            d="M 70 17 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#bbf7d0"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Needle */}
          <g transform={`rotate(${rotation}, 50, 50)`}>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="18"
              stroke="#1f2937"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="4" fill="#1f2937" />
          </g>

          {/* Labels */}
          <text x="10" y="48" fontSize="6" fill="#6b7280" textAnchor="middle">
            -1
          </text>
          <text x="90" y="48" fontSize="6" fill="#6b7280" textAnchor="middle">
            +1
          </text>
        </svg>
      </div>

      {/* Score display */}
      <div className="mt-2 text-center">
        <p className={`text-2xl font-bold font-mono ${getGaugeColor()}`}>
          {score >= 0 ? '+' : ''}{score.toFixed(3)}
        </p>
        <span className={getLabelBadge()}>
          {label.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
