import { useState } from 'react';
import { View, Image, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/stores/auth';
import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { EyeIcon, EyeOffIcon } from 'lucide-react-native';

export default function LoginScreen() {
  const { signInWithPassword, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSignIn() {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    setLoading(true);
    const res = await signInWithPassword({ email, password });
    setLoading(false);
    if (!res.error) router.replace('/');
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center gap-4 p-6">
          {/* Header */}
          <View className="mb-5 items-center">
            <Image
              source={require('@/assets/images/icr-check-logo.png')}
              className="mb-6 h-40"
              resizeMode="contain"
            />
            <Text className="text-center text-muted-foreground">
              Agiliza tus cobros: notifica y confirma en segundos
            </Text>
          </View>
          <View className="w-full gap-3">
            <View>
              <Text className="mb-2 text-sm font-medium text-foreground">Email</Text>
              <Input
                placeholder="Ingresa tu email"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-foreground">Contraseña</Text>
              <View className="relative">
                <Input
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  className="absolute right-3 top-3"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon
                    as={showPassword ? EyeOffIcon : EyeIcon}
                    className="text-muted-foreground"
                    size={20}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {error ? <Text className="text-red-600">{error}</Text> : null}
            <Button disabled={loading} onPress={onSignIn} className="mt-2">
              <Text className="text-white">Iniciar sesión</Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
