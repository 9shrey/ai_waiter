const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchMenu() {
  const res = await fetch(`${API_BASE}/api/menu`);
  if (!res.ok) throw new Error("Failed to fetch menu");
  return res.json();
}

export async function searchMenu(params: {
  q?: string;
  tags?: string;
  max_price?: number;
  spice_max?: number;
}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.tags) qs.set("tags", params.tags);
  if (params.max_price !== undefined) qs.set("max_price", String(params.max_price));
  if (params.spice_max !== undefined) qs.set("spice_max", String(params.spice_max));

  const res = await fetch(`${API_BASE}/api/menu/search?${qs}`);
  if (!res.ok) throw new Error("Failed to search menu");
  return res.json();
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  display_cards?: DisplayCard[];
}

export interface DisplayCard {
  type: "menu_item";
  item: import("@/lib/types").MenuItem;
}

export interface OrderItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

export interface ChatApiResponse {
  reply: string;
  conversation_history: ChatMessage[];
  display_cards: DisplayCard[];
  order_updates: unknown[];
  current_order: OrderItem[];
}

export async function sendChatMessage(payload: {
  visitor_id: string;
  message: string;
  conversation_history: ChatMessage[];
  current_order: OrderItem[];
}): Promise<ChatApiResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat failed: ${text}`);
  }
  return res.json();
}

export async function generateWhatsAppLink(
  items: OrderItem[]
): Promise<{ whatsapp_link: string; message: string; total: number }> {
  const res = await fetch(`${API_BASE}/api/order/whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error("Failed to generate WhatsApp link");
  }
  return res.json();
}
