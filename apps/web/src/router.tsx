import { Route, Routes } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { PortfolioPage } from './pages/PortfolioPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<PortfolioPage />} />
    </Routes>
  );
}
