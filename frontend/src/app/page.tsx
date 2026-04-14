"use client";

import Link from "next/link";
import Chat from "@/components/Chat";
import OrderSidebar from "@/components/OrderSidebar";
import { OrderProvider, useOrder } from "@/contexts/OrderContext";

function CartButton() {
  const { itemCount, total, setIsOpen } = useOrder();
  if (itemCount === 0) return null;
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-500"
    >
      🛒 {itemCount} · ${total.toFixed(2)}
    </button>
  );
}

function HomeContent() {
  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <span className="text-lg font-bold tracking-tight text-neutral-100">
            Taste of India
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CartButton />
          <Link
            href="/menu"
            className="rounded-full border border-neutral-700 px-4 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            View Menu
          </Link>
        </div>
      </header>

      {/* Chat fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>

      <OrderSidebar />
    </div>
  );
}

export default function Home() {
  return (
    <OrderProvider>
      <HomeContent />
    </OrderProvider>
  );
}
