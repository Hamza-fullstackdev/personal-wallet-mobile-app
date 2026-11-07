import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useAuthStore } from '../../store/authStore';
import type { ReceiptData } from '../../types';
import { ReceiptModal } from './ReceiptModal';

interface ReceiptContextValue {
  openReceipt: (receipt: ReceiptData) => void;
  closeReceipt: () => void;
}

const ReceiptContext = createContext<ReceiptContextValue | null>(null);

export function ReceiptProvider({ children }: { children: React.ReactNode }) {
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const openReceipt = useCallback((next: ReceiptData) => {
    setReceipt(next);
  }, []);

  const closeReceipt = useCallback(() => {
    setReceipt(null);
  }, []);

  const value = useMemo(
    () => ({ openReceipt, closeReceipt }),
    [openReceipt, closeReceipt],
  );

  return (
    <ReceiptContext.Provider value={value}>
      {children}
      <ReceiptModal
        visible={Boolean(receipt)}
        receipt={receipt}
        currency={currency}
        onClose={closeReceipt}
      />
    </ReceiptContext.Provider>
  );
}

export function useReceipt(): ReceiptContextValue {
  const context = useContext(ReceiptContext);
  if (!context) {
    throw new Error('useReceipt must be used within ReceiptProvider');
  }
  return context;
}
