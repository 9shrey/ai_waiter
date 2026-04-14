"use client";

import { useRef, useEffect, useState, FormEvent } from "react";
import { useVisitor } from "@/hooks/useVisitor";
import { useChat } from "@/hooks/useChat";
import ChatMessage from "@/components/ChatMessage";

const QUICK_REPLIES = [
  "What's popular?",
  "I need recommendations",
  "Show me vegetarian options",
];

export default function Chat() {
  const visitorId = useVisitor();
  const { messages, isLoading, error, send } = useChat(visitorId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput("");
  };

  const handleQuickReply = (text: string) => {
    if (isLoading) return;
    send(text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Welcome message (shown when no messages yet) */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <span className="text-6xl">🍽️</span>
            <h2 className="text-2xl font-bold text-neutral-100">
              Welcome to Taste of India!
            </h2>
            <p className="text-neutral-400 max-w-sm">
              Hey! I&apos;m your AI waiter. Ask me anything about the menu — I&apos;ll
              help you find the perfect meal.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {QUICK_REPLIES.map((text) => (
                <button
                  key={text}
                  onClick={() => handleQuickReply(text)}
                  className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
              <span className="text-xs font-medium text-amber-400 block mb-1">
                🍽️ Waiter
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto rounded-lg bg-red-950/50 border border-red-800 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about the menu..."
            disabled={isLoading}
            className="flex-1 rounded-full border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-amber-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center rounded-full bg-amber-600 p-3 text-white transition-colors hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.105 2.29a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086L2.28 16.76a.75.75 0 0 0 .826.95l15.5-5.5a.75.75 0 0 0 0-1.42l-15.5-5.5Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
