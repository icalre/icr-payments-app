import { NativeModules, DeviceEventEmitter, EmitterSubscription, Platform, PermissionsAndroid } from 'react-native';
import Constants from 'expo-constants';

const { NotificationBridge } = NativeModules as any;

// Verificar si estamos en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Debug temporal
console.log('Environment info:', {
  isExpoGo,
  appOwnership: Constants.appOwnership,
  availableModules: Object.keys(NativeModules),
  notificationBridgeAvailable: !!NotificationBridge
});

export type NotificationEvent = {
  packageName?: string;
  id?: number;
  postTime?: number;
  title?: string;
  text?: string;
  subText?: string;
};

export type NotificationListenerHandle = EmitterSubscription;

export function addNotificationPostedListener(
  listener: (event: NotificationEvent) => void
): NotificationListenerHandle {
  return DeviceEventEmitter.addListener('NotificationPosted', listener);
}

export function addNotificationRemovedListener(
  listener: (event: NotificationEvent) => void
): NotificationListenerHandle {
  return DeviceEventEmitter.addListener('NotificationRemoved', listener);
}

export async function isNotificationAccessEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  if (isExpoGo) {
    console.warn('Notification listener no está disponible en Expo Go. Necesitas crear un development build.');
    return false;
  }

  if (!NotificationBridge || typeof NotificationBridge.isEnabled !== 'function') {
    console.log('NotificationBridge or isEnabled method not available');
    return false;
  }

  try {
    const isEnabled = await NotificationBridge.isEnabled();
    console.log('isNotificationAccessEnabled', isEnabled);
    return isEnabled;
  } catch (error) {
    console.warn('Error checking notification access:', error);
    return false;
  }
}

export function openNotificationAccessSettings() {
  if (Platform.OS !== 'android') return;

  if (isExpoGo) {
    console.warn('openNotificationAccessSettings no está disponible en Expo Go');
    return;
  }

  if (!NotificationBridge || typeof NotificationBridge.openSettings !== 'function') {
    console.warn('NotificationBridge.openSettings not available');
    return;
  }

  try {
    NotificationBridge.openSettings();
  } catch (error) {
    console.warn('Error opening notification settings:', error);
  }
}

export async function getSavedNotifications(): Promise<NotificationEvent[]> {
  if (Platform.OS !== 'android') return [];

  if (isExpoGo) {
    console.warn('getSavedNotifications no está disponible en Expo Go');
    return [];
  }

  if (!NotificationBridge || typeof NotificationBridge.getSaved !== 'function') {
    console.warn('NotificationBridge.getSaved not available');
    return [];
  }

  try {
    const arr = await NotificationBridge.getSaved();
    return Array.isArray(arr) ? arr : [];
  } catch (error) {
    console.warn('Error getting saved notifications:', error);
    return [];
  }
}

export async function clearSavedNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;

  if (isExpoGo) {
    console.warn('clearSavedNotifications no está disponible en Expo Go');
    return;
  }

  if (!NotificationBridge || typeof NotificationBridge.clearSaved !== 'function') {
    console.warn('NotificationBridge.clearSaved not available');
    return;
  }

  try {
    await NotificationBridge.clearSaved();
  } catch (error) {
    console.warn('Error clearing saved notifications:', error);
  }
}

export async function requestRuntimeNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  if (isExpoGo) {
    console.warn('requestRuntimeNotificationPermission parcialmente disponible en Expo Go');
    // Intentamos solo el permiso de runtime, sin el SDK check
    try {
      if (!PermissionsAndroid?.request) return true;
      const result = await PermissionsAndroid.request(
        // @ts-ignore
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any
      );
      return result === PermissionsAndroid.RESULTS.GRANTED || result === 'granted';
    } catch {
      return false;
    }
  }

  try {
    let sdkInt: number | undefined = undefined;

    if (NotificationBridge && typeof NotificationBridge.getSdkInt === 'function') {
      try {
        sdkInt = await NotificationBridge.getSdkInt();
      } catch (error) {
        console.warn('Failed to get SDK int:', error);
      }
    }

    console.log('requestRuntimeNotificationPermission', sdkInt);

    const needsRuntime = typeof sdkInt === 'number' ? sdkInt >= 33 : true;
    if (!needsRuntime) return true;

    if (!PermissionsAndroid?.request) return true;

    const result = await PermissionsAndroid.request(
      // @ts-ignore
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS as any
    );
    return result === PermissionsAndroid.RESULTS.GRANTED || result === 'granted';
  } catch {
    console.warn('Failed to request runtime notification permission');
    return false;
  }
}

export async function enableNotificationAccessFlow(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  if (isExpoGo) {
    console.warn('enableNotificationAccessFlow no está completamente disponible en Expo Go. Necesitas crear un development build.');
    return false;
  }

  await requestRuntimeNotificationPermission();

  if (await isNotificationAccessEnabled()) return true;

  openNotificationAccessSettings();

  const start = Date.now();
  const timeoutMs = 15000;
  const intervalMs = 800;
  let enabled = await isNotificationAccessEnabled();
  while (!enabled && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    enabled = await isNotificationAccessEnabled();
  }
  return enabled;
}