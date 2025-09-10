import '@/global.css';
import '@/lib/headless';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/components/auth-provider';
import { KeyboardAvoidingView, Platform } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider value={NAV_THEME['light']}>
      <StatusBar style={'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <AuthProvider>
          <Stack />
        </AuthProvider>
        <PortalHost />
      </KeyboardAvoidingView>
    </ThemeProvider>
  );
}
