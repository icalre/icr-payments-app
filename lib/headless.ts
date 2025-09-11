import { AppRegistry } from 'react-native';
import { usePhone } from '@/stores/phone';
import { useAuth } from '@/stores/auth';
import { messagesService } from '@/services/messages.service';
import {clearSavedNotifications} from '@/lib/notification-listener';

// Registers a background handler for notification events.
// Consumers can import this module once at startup to ensure registration.
AppRegistry.registerHeadlessTask('NotificationEvent', () => async (data: any) => {
  // You can add custom handling here if needed.
  // For now, we simply no-op. The native side already persists events.
  // console.log('Headless NotificationEvent', data);
  try{
    const auth = useAuth.getState();
    const phone = usePhone.getState();

    if (data.packageName === 'com.bcp.innovacxion.yapeapp') {
      let message_split = data.text.split(':');
      const message_data = {
        message: data.text,
        code: message_split[1] ? message_split[1].trim() : '',
        amount: Number(message_split[0].split('S/')[1].split('.')[0].trim()),
        user_id: auth.user?.id,
        phone_id: phone.phone?.value,
        provider: 'Yape',
      };

      phone.setRefetch(phone.refetch + 1);
      await messagesService.sendMessage(message_data);
    }

    if (data?.text.toLowerCase().includes('plineado')) {
      const match = data.text.match(/S\/\s*(\d+(?:\.\d{2})?)/);
      const amount = match ? parseFloat(match[1]) : 0;
      const message_data = {
        message: data.text,
        code: '',
        amount: amount,
        user_id: auth.user?.id,
        phone_id: phone.phone?.value,
        provider: 'Plin',
      };

      phone.setRefetch(phone.refetch + 1);
      await messagesService.sendMessage(message_data);
    }

    await clearSavedNotifications();
  }catch(error){
    console.log('error', error);
  }

});
