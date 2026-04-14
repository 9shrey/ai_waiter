"use client";

import { useEffect, useState } from "react";
import { fetchMenu } from "@/lib/api";
import type { Menu, DailySpecial } from "@/lib/types";
import MenuCard from "@/components/MenuCard";
import Link from "next/link";

export default function MenuPage() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchMenu()
      .then((data: Menu) => {
        setMenu(data);
        if (data.categories.length > 0) {
          setActiveCategory(data.categories[0].name);
        }
      })
      .catch(() => setError("Couldn't load the menu. Is the backend running?"));
  }, []);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-red-400 text-lg">{error}</p>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-amber-500" />
      </main>
    );
  }

  const specialsMap = new Map<string, DailySpecial>();
  menu.daily_specials.forEach((s) => specialsMap.set(s.item_id, s));

  const currentCategory = menu.categories.find((c) => c.name === activeCategory);

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold tracking-tight text-neutral-100">
              {menu.restaurant}
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
          >
            Ask the Waiter
          </Link>
        </div>

        {/* Category tabs */}
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            {menu.categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat.name
                    ? "bg-amber-600 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Daily Specials Banner */}
      {menu.daily_specials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-400 mb-2">
              🔥 Today&apos;s Specials
            </h2>
            <div className="flex flex-wrap gap-3">
              {menu.daily_specials.map((special) => {
                const item = menu.categories
                  .flatMap((c) => c.items)
                  .find((i) => i.id === special.item_id);
                if (!item) return null;
                return (
                  <span
                    key={special.item_id}
                    className="rounded-full bg-amber-900/40 px-3 py-1 text-sm text-amber-200"
                  >
                    {item.name} — {special.discount_percent}% off · {special.note}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Combos */}
      {menu.combos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
            Combo Deals
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menu.combos.map((combo) => (
              <div
                key={combo.name}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col"
              >
                <h3 className="font-semibold text-neutral-100">{combo.name}</h3>
                <p className="mt-1 text-sm text-neutral-400">{combo.description}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-lg font-bold text-amber-400">
                    ${combo.combo_price.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-400">
                    Save ${combo.savings.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Grid */}
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <h2 className="text-2xl font-bold text-neutral-100 mb-6">{activeCategory}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentCategory?.items
            .filter((item) => item.available)
            .map((item) => {
              const special = specialsMap.get(item.id);
              return (
                <MenuCard
                  key={item.id}
                  item={item}
                  discountPercent={special?.discount_percent}
                  discountNote={special?.note}
                />
              );
            })}
        </div>
      </section>
    </main>
  );
}
