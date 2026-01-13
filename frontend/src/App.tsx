import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t bg-white">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>Metal Industry Sentiment Analysis | InvestRite</p>
            <p className="mt-1">
              Powered by FinBERT NLP for financial sentiment analysis
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
