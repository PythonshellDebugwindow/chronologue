import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  SelectedLanguageContextProvider
} from '@/contexts/SelectedLanguageContext';

import { appRouter } from '@/routes';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      gcTime: 0,
      refetchOnWindowFocus: false
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SelectedLanguageContextProvider>
        <RouterProvider router={appRouter} />
      </SelectedLanguageContextProvider>
    </QueryClientProvider>
  );
}
