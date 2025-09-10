import { Stack } from 'expo-router';
import * as React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import NotificationListener from '@/components/NotificationListener';
import { useAuth } from '@/stores/auth';
import {  LogOut } from 'lucide-react-native';


export default function HomeScreen() {
  const { user, signOut } = useAuth();
  return (
    <>
      <Stack.Screen
        options={{
          title: `Hola, ${user?.email}`,
          headerRight: () => (
            <TouchableOpacity
              onPress={signOut}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <LogOut size={24} color="black" />
            </TouchableOpacity>
          )
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center gap-8 p-4">
          {/* Notification Demo Section */}
          <NotificationListener showButton />
        </View>
      </ScrollView>
    </>
  );
}
