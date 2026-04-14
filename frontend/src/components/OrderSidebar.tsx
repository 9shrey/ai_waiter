"use client";

import { useOrder } from "@/contexts/OrderContext";
import { generateWhatsAppLink } from "@/lib/api";
import { useState } from "react";

export default function OrderSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearOrder, total, itemCount } =
    useOrder();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const { whatsapp_link } = await generateWhatsAppLink(items);
      window.open(whatsapp_link, "_blank");
    } catch {
      // Fallback: build link client-side
      const phone = "1234567890";
      const lines = [
        "🍽️ New Order from Taste of India",
        "",
        ...items.map(
          (i) =>
            `• ${i.quantity}x ${i.name} — $${(i.price * i.quantity).toFixed(2)}${i.notes ? ` (${i.notes})` : ""}`
        ),
        "",
        `💰 Total: $${total.toFixed(2)}`,
      ];
      const encoded = encodeURIComponent(lines.join("\n"));
      window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Floating cart button (visible when sidebar is closed and has items) */}
      {!isOpen && itemCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-amber-500 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
          </svg>
          <span className="font-semibold">{itemCount}</span>
          <span className="text-sm">${total.toFixed(2)}</span>
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-neutral-950 border-l border-neutral-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h2 className="text-lg font-bold text-neutral-100">Your Order</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-neutral-500">
              <span className="text-4xl">🍽️</span>
              <p className="text-sm">Your order is empty.</p>
              <p className="text-xs">Chat with the waiter to add items!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.item_id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-100 truncate">
                      {item.name}
                    </h3>
                    {item.notes && (
                      <p className="mt-0.5 text-xs text-neutral-500 italic truncate">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-amber-400">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-neutral-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(item.item_id)}
                    className="text-xs text-red-400 transition-colors hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with total & checkout */}
        {items.length > 0 && (
          <div className="border-t border-neutral-800 px-4 py-4 space-y-3">
            {/* Order total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Total</span>
              <span className="text-xl font-bold text-neutral-100">
                ${total.toFixed(2)}
              </span>
            </div>

            {total < 10 && (
              <p className="text-xs text-amber-400/80 text-center">
                Minimum order is $10.00 — add ${(10 - total).toFixed(2)} more
              </p>
            )}

            {/* WhatsApp checkout */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || total < 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              {isCheckingOut ? "Opening WhatsApp..." : "Order via WhatsApp"}
            </button>

            {/* Clear order */}
            <button
              onClick={clearOrder}
              className="w-full text-center text-xs text-neutral-500 transition-colors hover:text-red-400"
            >
              Clear order
            </button>
          </div>
        )}
      </div>
    </>
  );
}
