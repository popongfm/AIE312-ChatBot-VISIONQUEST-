import { createBrowserRouter } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => ({
      Component: (await import('./pages/PortfolioPage')).PortfolioPage,
    }),
  },
  {
    path: '/chat',
    lazy: async () => ({
      Component: (await import('./pages/ChatPage')).ChatPage,
    }),
  },
]);
