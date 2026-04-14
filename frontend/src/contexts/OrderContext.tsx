"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { OrderItem } from "@/lib/api";

interface OrderContextType {
  items: OrderItem[];
  setItems: (items: OrderItem[]) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearOrder: () => void;
  total: number;
  itemCount: number;
}

const OrderContext = createContext<OrderContextType>({
  items: [],
  setItems: () => {},
  isOpen: false,
  setIsOpen: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearOrder: () => {},
  total: 0,
  itemCount: 0,
});

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const prevCount = useRef(0);

  // Auto-open sidebar when items are added
  useEffect(() => {
    if (items.length > prevCount.current && items.length > 0) {
      setIsOpen(true);
    }
    prevCount.current = items.length;
  }, [items.length]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.item_id !== itemId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, quantity: qty } : i))
    );
  }, []);

  const clearOrder = useCallback(() => {
    setItems([]);
    setIsOpen(false);
  }, []);

  return (
    <OrderContext.Provider
      value={{
        items,
        setItems,
        isOpen,
        setIsOpen,
        removeItem,
        updateQuantity,
        clearOrder,
        total,
        itemCount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}
