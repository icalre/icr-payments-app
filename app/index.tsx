import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/stores/auth';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';

export default function Screen() {
  const { isAuthenticated , isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Pequeño delay para asegurar que la navegación esté lista
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(authenticated)/home');
        } else {
          router.replace('/(guest)/login');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#007AFF" />
      <Text className="mt-4 text-muted-foreground">
        {isLoading ? 'Verificando autenticación...' : 'Redirigiendo...'}
      </Text>
    </View>
  );
}
