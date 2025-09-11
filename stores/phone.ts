import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PhonesState {
  phone: any;
  company: any;
  refetch: number;
  setPhone: (phone: any) => void;
  setCompany: (company: any) => void;
  setRefetch: (refetch: number) => void;
}

export const usePhone = create<PhonesState>()(
  persist(
    (set) => ({
      company: null,
      phone: null,
      refetch: 0,
      setPhone: (phone) => set({ phone }),
      setCompany: (company) => set({ company }),
      setRefetch: (refetch) => set({ refetch }),
    }),
    {
      name: 'phones-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);