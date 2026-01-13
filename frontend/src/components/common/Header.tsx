import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Metal Sentiment
              </h1>
              <p className="text-xs text-gray-500">
                Indian Metal Industry Analysis
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition text-sm font-medium"
            >
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
