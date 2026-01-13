import { ExternalLink, Newspaper } from 'lucide-react';
import { NewsItem } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import SentimentBadge from './SentimentBadge';

interface NewsListProps {
  news: NewsItem[];
}

export default function NewsList({ news }: NewsListProps) {
  if (!news || news.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Newspaper className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No news articles available</p>
        <p className="text-sm text-gray-400 mt-1">
          Click "Refresh Data" to fetch latest news
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <article
          key={item.id}
          className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {item.title}
              </h3>

              {/* Description */}
              {item.description && (
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* Meta info */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>{item.source}</span>
                <span>•</span>
                <span>{formatRelativeTime(item.pubDate)}</span>

                {/* Sentiment Badge */}
                {item.sentiment && (
                  <>
                    <span>•</span>
                    <SentimentBadge
                      label={item.sentiment.label}
                      confidence={item.sentiment.confidence}
                    />
                  </>
                )}
              </div>
            </div>

            {/* External Link */}
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shrink-0"
              title="Open article"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
