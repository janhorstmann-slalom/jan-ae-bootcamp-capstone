import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import GameResult from './pages/GameResult';
import History from './pages/History';
import GameDetail from './pages/GameDetail';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/game/:id/result" element={<GameResult />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<GameDetail />} />
      </Routes>
    </ErrorBoundary>
  );
}
