// src/app.js
import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LeaderboardPage from './pages/LeaderboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
    </Routes>
  );
}
