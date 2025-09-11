
import { supabase } from '@/lib/supabase';

class CompanyService {
  async getCompanies(userId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error('Error fetching companies');
    }

    return data;
  }

  async getPhones(id: number, userId: string) {
    const { data, error } = await supabase
      .from('phones')
      .select('*')
      .eq('company_id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Error fetching phones');
    }

    return data;
  }
}

export const companyService = new CompanyService();