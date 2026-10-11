'use client';

import { useEffect } from 'react';
import { useDemoStore } from '@/lib/store';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useDemoStore.persist.rehydrate();

    const syncStore = () => void useDemoStore.persist.rehydrate();
    const syncStorage = (event: StorageEvent) => {
      if (event.key === 'visavault-demo-v1') syncStore();
    };
    const channel = new BroadcastChannel('visavault');
    channel.addEventListener('message', syncStore);
    window.addEventListener('storage', syncStorage);

    return () => {
      channel.close();
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  return children;
}