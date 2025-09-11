import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import {
  addNotificationPostedListener,
  addNotificationRemovedListener,
  isNotificationAccessEnabled,
  openNotificationAccessSettings,
  enableNotificationAccessFlow
} from '@/lib/notification-listener';

type Props = {
  showButton?: boolean;
};

import {usePhone} from '@/stores/phone';

export default function NotificationListener({ showButton = true }: Props) {
  const [enabled, setEnabled] = useState(false);
  const { refetch, setRefetch } = usePhone();

  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    if (isExpoGo) {
      console.log('Ejecutándose en Expo Go - funcionalidad limitada');
      return;
    }

    isNotificationAccessEnabled().then(setEnabled);
    const sub1 = addNotificationPostedListener(() => setRefetch(refetch + 1));
    const sub2 = addNotificationRemovedListener(() => {});

    const appStateSub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const ok = await isNotificationAccessEnabled();
        console.log('NotificationListener: App state change, is enabled?', ok);
        setEnabled(ok);
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
      appStateSub.remove();
    };
  }, []);

  if (Platform.OS !== 'android') {
    return (
      <View>
        <Text>Captura de notificaciones solo está disponible en Android.</Text>
      </View>
    );
  }

  if (isExpoGo) {
    return (
      <View style={{ padding: 16, backgroundColor: '#fff3cd', borderRadius: 8, margin: 8 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>⚠️ Funcionalidad limitada</Text>
        <Text>
          Estás ejecutando la app en Expo Go. La captura de notificaciones requiere un development build.
        </Text>
        <Text style={{ marginTop: 8, fontSize: 12 }}>
          Ejecuta: npx expo prebuild && npx expo run:android
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="font-bold color-emerald-700 text-center text-xl">Servicio: {enabled ? 'Habilitado' : 'Deshabilitado'}</Text>
      {showButton && !enabled && (
        <Button
          title="Habilitar Servicio de Notificaciones"
          onPress={async () => {
            const finalEnabled = await enableNotificationAccessFlow();
            if (!finalEnabled) {
              openNotificationAccessSettings();
            }
            const isEnabled = await isNotificationAccessEnabled();
            console.log('NotificationListener: After enable, is enabled?', isEnabled);
            setEnabled(isEnabled);
          }}
        />
      )}
    </View>
  );
}