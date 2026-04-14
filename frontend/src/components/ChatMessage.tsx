import type { ChatMessage as ChatMsg } from "@/lib/api";
import type { MenuItem } from "@/lib/types";

const spiceDisplay = ["", "🌶️", "🌶️🌶️", "🌶️🌶️🌶️", "🌶️🌶️🌶️🌶️", "🔥"];

function InlineFoodCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex gap-3 rounded-xl border border-neutral-700 bg-neutral-800/60 p-3 mt-2">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-700 text-2xl">
        {item.tags?.includes("vegetarian") || item.tags?.includes("vegan")
          ? "🥬"
          : item.tags?.includes("seafood")
          ? "🐟"
          : item.tags?.includes("sweet")
          ? "🍨"
          : item.tags?.includes("hot")
          ? "☕"
          : item.tags?.includes("refreshing")
          ? "🍋"
          : "🍛"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-neutral-100 leading-tight">
            {item.name}
          </h4>
          <span className="shrink-0 text-sm font-bold text-amber-400">
            ${item.price?.toFixed(2)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-400 line-clamp-2">{item.description}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
          {item.spice_level > 0 && <span>{spiceDisplay[item.spice_level]}</span>}
          {item.tags?.includes("popular") && (
            <span className="rounded-full bg-amber-900/40 px-1.5 py-0.5 text-amber-300">Popular</span>
          )}
          {item.tags?.includes("vegetarian") && (
            <span className="rounded-full bg-emerald-900/40 px-1.5 py-0.5 text-emerald-300">Veg</span>
          )}
          {item.tags?.includes("vegan") && (
            <span className="rounded-full bg-green-900/40 px-1.5 py-0.5 text-green-300">Vegan</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: ChatMsg;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const cards = message.display_cards || [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-amber-600 text-white rounded-br-md"
            : "bg-neutral-800 text-neutral-100 rounded-bl-md"
        }`}
      >
        {!isUser && (
          <span className="mb-1 block text-xs font-medium text-amber-400">
            🍽️ Waiter
          </span>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Rich menu cards */}
        {cards.length > 0 && (
          <div className="mt-2 space-y-2">
            {cards.map((card, i) => (
              <InlineFoodCard key={i} item={card.item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
