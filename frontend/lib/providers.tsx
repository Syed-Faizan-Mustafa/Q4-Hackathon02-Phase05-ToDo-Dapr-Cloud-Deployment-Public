'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute - reduce refetches
            gcTime: 10 * 60 * 1000, // 10 minutes cache time
            retry: 2, // Retry twice for Neon cold starts
            retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            networkMode: 'offlineFirst', // Use cache first
          },
          mutations: {
            retry: 1, // Retry mutations once for Neon
            retryDelay: 1000,
            networkMode: 'offlineFirst',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
