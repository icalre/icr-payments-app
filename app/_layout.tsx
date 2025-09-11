import '@/global.css';
import '@/lib/headless';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/components/auth-provider';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        console.error('Error in query:', error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error('Error in mutation:', error);
      },
    }),
  });

  return (
    <ThemeProvider value={NAV_THEME['light']}>
      <StatusBar style={'dark'} />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Stack />
        </QueryClientProvider>
      </AuthProvider>
      <PortalHost />
    </ThemeProvider>
  );
}
