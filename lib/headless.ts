import { AppRegistry } from 'react-native';

// Registers a background handler for notification events.
// Consumers can import this module once at startup to ensure registration.
AppRegistry.registerHeadlessTask('NotificationEvent', () => async (data: any) => {
  // You can add custom handling here if needed.
  // For now, we simply no-op. The native side already persists events.
  // console.log('Headless NotificationEvent', data);
  console.log('payload', data);
});
