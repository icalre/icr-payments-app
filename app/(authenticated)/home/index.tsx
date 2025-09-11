import { Stack } from 'expo-router';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import NotificationListener from '@/components/NotificationListener';
import { useAuth } from '@/stores/auth';
import { LogOut } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { usePhone } from '@/stores/phone';
import { Text } from '@/components/ui/text';
import { companyService } from '@/services/company.service';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/components/ui/select';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Label } from '@/components/ui/label';
import { messagesService } from '@/services/messages.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import dayjs from 'dayjs';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { phone, company, refetch, setPhone, setCompany, setRefetch } = usePhone();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }),
    left: 12,
    right: 12,
  };

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const response = await companyService.getCompanies(`${user?.id}`);
        if (response.length > 0) {
          setCompany({
            value: response[0].id,
            label: response[0].name,
          });
        }

        return response;
      } catch (error) {
        console.error('Error fetching companies:', error);
        return [];
      }
    },
  });

  const { data: phones } = useQuery({
    queryKey: ['phones', company],
    queryFn: async () => {
      setPhone(null);
      try {
        const response = await companyService.getPhones(company?.value, `${user?.id}`);
        if (response.length > 0) {
          setPhone({ value: response[0].id, label: response[0].number });
          setRefetch(refetch + 1);
        }
        return response;
      } catch (error) {
        console.log('Error fetching phones: ', error);
        return [];
      }
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', phone, refetch],
    queryFn: async () => {
      try {
        return await messagesService.getMessages(phone?.value, `${user?.id}`);
      } catch (error) {
        console.log('Error fetching messages: ', error);
        return [];
      }
    },
  });

  const handleChangeCompany = (value: any) => {
    setCompany(value);
  };

  const handleChangePhone = (value: any) => {
    setPhone(value);
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: `Hola, ${user?.user_metadata?.name}`,
            headerRight: () => (
              <TouchableOpacity
                onPress={signOut}
                className="p-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <LogOut size={24} color="black" />
              </TouchableOpacity>
            ),
          }}
        />
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-muted-foreground">Cargando...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Hola, ${user?.user_metadata?.name}`,
          headerRight: () => (
            <TouchableOpacity
              onPress={signOut}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <LogOut size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center gap-8 p-4">
          {/* Notification Demo Section */}
          <NotificationListener showButton />
          <View className="flex gap-4">
            <Label>Empresa</Label>
            <Select onValueChange={handleChangeCompany} value={company}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleciona una empresa" />
              </SelectTrigger>
              <SelectContent insets={contentInsets} className="w-full">
                <SelectGroup>
                  <SelectLabel>Empresas</SelectLabel>
                  {(companies || []).map((row: any) => (
                    <SelectItem label={row.name} value={row.id} key={row.id} />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
          <View className="flex gap-4">
            <Label>Telefono</Label>
            <Select onValueChange={handleChangePhone} value={phone}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleciona una telefono" />
              </SelectTrigger>
              <SelectContent insets={contentInsets} className="w-full">
                <SelectGroup>
                  <SelectLabel>Telefonos</SelectLabel>
                  {(phones || []).map((row: any) => (
                    <SelectItem label={row.number} value={row.id} key={row.id} />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
          <Card className="w-full mb-10">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle>Últimas 20 notificaciones enviadas</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="min-w-full">
                  {/* Table Header */}
                  <View className="flex-row rounded-t-lg bg-muted/50 p-3">
                    <View className="w-24">
                      <Text className="text-center text-sm font-medium">Fecha</Text>
                    </View>
                    <View className="w-20">
                      <Text className="text-center text-sm font-medium">Monto</Text>
                    </View>
                    <View className="w-20">
                      <Text className="text-center text-sm font-medium">Código</Text>
                    </View>
                    <View className="w-60">
                      <Text className="text-center text-sm font-medium">Mensaje</Text>
                    </View>
                  </View>
                  {/* Table Rows */}
                  {(messages || []).map((row: any) => (
                    <View key={row.id}>
                      <View className="flex-row border-b border-border/50 p-3">
                        <View className="w-24">
                          <Text className="text-sm">
                            {dayjs(row.created_at).format('DD/MM/YYYY HH:mm:ss')}
                          </Text>
                        </View>
                        <View className="w-20 pr-2">
                          <Text className="text-right text-sm font-medium">
                            {Number(row.amount).toFixed(2)}
                          </Text>
                        </View>
                        <View className="w-20">
                          <Text className="text-center text-sm font-medium">{row.code}</Text>
                        </View>
                        <View className="w-60">
                          <Text className="text-sm"> {row.message}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
