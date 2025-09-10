import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/stores/auth';
import { Text } from '@/components/ui/text';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-4 text-muted-foreground">Verificando autenticación...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
