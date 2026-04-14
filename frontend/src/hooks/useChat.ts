"use client";

import { useState, useCallback } from "react";
import { sendChatMessage, type ChatMessage } from "@/lib/api";
import { useOrder } from "@/contexts/OrderContext";

export function useChat(visitorId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { items: currentOrder, setItems: setCurrentOrder } = useOrder();

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !visitorId) return;
      setError("");

      // Optimistically add user message
      const userMsg: ChatMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await sendChatMessage({
          visitor_id: visitorId,
          message: text,
          conversation_history: messages,
          current_order: currentOrder,
        });

        // Attach display_cards to the assistant's last message
        const updatedHistory = res.conversation_history.map((msg, i) => {
          if (i === res.conversation_history.length - 1 && msg.role === "assistant") {
            return { ...msg, display_cards: res.display_cards };
          }
          return msg;
        });

        setMessages(updatedHistory);

        // Update order state from agent response
        if (res.current_order && res.current_order.length > 0) {
          setCurrentOrder(res.current_order);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [visitorId, messages, currentOrder, setCurrentOrder]
  );

  return { messages, isLoading, error, send };
}
