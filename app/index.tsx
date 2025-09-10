import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import * as React from 'react';
import {View } from 'react-native';
import NotificationListener from '@/components/NotificationListener';

export default function Screen() {
  return (
    <>
      <Stack.Screen options={
        {
          title: 'React Native Reusables',
          headerTransparent: true,
          headerShadowVisible: true
        }
      } />
      <View className="flex-1 items-center justify-center gap-8 p-4 mt-10">
        {/* Notification Demo Section */}
        <View className="w-full flex-1 mt-10">
          <Text className="text-lg font-semibold text-center mb-4">
            Notification Listener Demo
          </Text>
          <NotificationListener showButton />
        </View>
      </View>
    </>
  );
}
