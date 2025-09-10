import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform, ScrollView, AppState } from 'react-native';
import Constants from 'expo-constants';
import {
  addNotificationPostedListener,
  addNotificationRemovedListener,
  isNotificationAccessEnabled,
  openNotificationAccessSettings,
  enableNotificationAccessFlow,
  NotificationEvent,
  getSavedNotifications,
  clearSavedNotifications,
} from '@/lib/notification-listener';

type Props = {
  showButton?: boolean;
};

export default function NotificationListener({ showButton = true }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [last, setLast] = useState<NotificationEvent | null>(null);
  const [saved, setSaved] = useState<NotificationEvent[]>([]);

  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    if (isExpoGo) {
      console.log('Ejecutándose en Expo Go - funcionalidad limitada');
      return;
    }

    isNotificationAccessEnabled().then(setEnabled);
    getSavedNotifications().then(setSaved);
    const sub1 = addNotificationPostedListener((e) => setLast(e));
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
      <Text className="font-bold color-emerald-700 text-center">Acceso a notificaciones: {enabled ? 'Habilitado' : 'Deshabilitado'}</Text>
      {showButton && !enabled && (
        <Button
          title="Habilitar acceso"
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
      <View style={{ marginTop: 12 }}>
        <Button title="Actualizar Notificaciones guardadas" onPress={() => getSavedNotifications().then(setSaved)} />
        <View style={{ height: 8 }} />
        <Button title="Limpiar Notificaciones guardadas" onPress={async () => { await clearSavedNotifications(); setSaved([]); }} />
        <Text style={{ marginTop: 8 }}>Guardadas en background: {saved.length}</Text>
      </View>
      {saved.length > 0 && (
        <ScrollView style={{ maxHeight: 200, marginTop: 8 }}>
          {saved.slice(-5).reverse().map((n, idx) => (
            <View key={idx} style={{ marginBottom: 6 }}>
              <Text>{new Date(n.postTime || 0).toLocaleString()} - {n.packageName}</Text>
              <Text>{n.title}</Text>
              <Text>{n.text}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}