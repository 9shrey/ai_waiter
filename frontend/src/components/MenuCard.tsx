import { MenuItem } from "@/lib/types";

const spiceDisplay = ["—", "🌶️", "🌶️🌶️", "🌶️🌶️🌶️", "🌶️🌶️🌶️🌶️", "🔥"];

interface MenuCardProps {
  item: MenuItem;
  currencySymbol?: string;
  discountPercent?: number;
  discountNote?: string;
}

export default function MenuCard({
  item,
  currencySymbol = "$",
  discountPercent,
  discountNote,
}: MenuCardProps) {
  const hasDiscount = discountPercent && discountPercent > 0;
  const discountedPrice = hasDiscount
    ? item.price * (1 - discountPercent / 100)
    : item.price;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-700 hover:shadow-lg hover:shadow-orange-950/20">
      {/* Image placeholder */}
      <div className="relative h-48 w-full bg-neutral-800 flex items-center justify-center overflow-hidden">
        <span className="text-5xl select-none">
          {item.tags.includes("vegetarian") || item.tags.includes("vegan")
            ? "🥬"
            : item.tags.includes("seafood")
            ? "🐟"
            : item.tags.includes("sweet")
            ? "🍨"
            : item.tags.includes("hot")
            ? "☕"
            : item.tags.includes("refreshing")
            ? "🍋"
            : "🍛"}
        </span>

        {/* Tags */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.tags.includes("popular") && (
            <span className="rounded-full bg-amber-600/90 px-2 py-0.5 text-xs font-medium text-white">
              Popular
            </span>
          )}
          {item.tags.includes("best-seller") && (
            <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-xs font-medium text-white">
              #1 Seller
            </span>
          )}
          {item.tags.includes("vegan") && (
            <span className="rounded-full bg-green-600/90 px-2 py-0.5 text-xs font-medium text-white">
              Vegan
            </span>
          )}
          {item.tags.includes("vegetarian") && !item.tags.includes("vegan") && (
            <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-xs font-medium text-white">
              Veg
            </span>
          )}
        </div>

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-neutral-100">{item.name}</h3>
          <div className="flex flex-col items-end shrink-0">
            {hasDiscount ? (
              <>
                <span className="text-xs text-neutral-500 line-through">
                  {currencySymbol}{item.price.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-amber-400">
                  {currencySymbol}{discountedPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-amber-400">
                {currencySymbol}{item.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{item.description}</p>

        {hasDiscount && discountNote && (
          <p className="mt-1 text-xs font-medium text-rose-400">{discountNote}</p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center justify-between pt-3">
          {item.spice_level > 0 && (
            <span className="text-sm" title={`Spice level: ${item.spice_level}/5`}>
              {spiceDisplay[item.spice_level]}
            </span>
          )}
          {item.allergens.length > 0 && (
            <span className="text-xs text-neutral-500" title={`Allergens: ${item.allergens.join(", ")}`}>
              ⚠ {item.allergens.join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
