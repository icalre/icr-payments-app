import { supabase } from '@/lib/supabase';

class MessagesService {
  async getMessages(phone_id: number, userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('phone_id', phone_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(0, 20);

    if (error) {
      throw new Error('Error fetching messages');
    }

    return data;
  }

  async sendMessage(message: any) {
    const { error } = await supabase.from('messages').insert([message]);

    if (error) {
      throw new Error('Error sending message');
    }
  }
}

export const messagesService = new MessagesService();
