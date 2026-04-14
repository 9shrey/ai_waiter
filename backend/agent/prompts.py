import json
from pathlib import Path

MENU_PATH = Path(__file__).resolve().parent.parent.parent / "menu.json"
CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "restaurant_config.json"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build_system_prompt(user_context: dict | None = None, current_order: list | None = None) -> str:
    config = _load_json(CONFIG_PATH)
    menu = _load_json(MENU_PATH)

    # --- Personality ---
    personality = config["agent_personality"]

    # --- Menu data (compact) ---
    menu_lines = [f"## Full Menu — {menu['restaurant']}"]
    for cat in menu["categories"]:
        menu_lines.append(f"\n### {cat['name']}")
        for item in cat["items"]:
            avail = "✓" if item["available"] else "✗ SOLD OUT"
            tags = ", ".join(item["tags"])
            allergens = ", ".join(item["allergens"]) if item["allergens"] else "none"
            spice = "🌶️" * item["spice_level"] if item["spice_level"] > 0 else "mild"
            pairs = ", ".join(item["pairs_with"]) if item["pairs_with"] else ""
            menu_lines.append(
                f"- [{avail}] **{item['name']}** (id: {item['id']}) — ${item['price']:.2f}\n"
                f"  {item['description']}\n"
                f"  Tags: {tags} | Allergens: {allergens} | Spice: {spice} | Pairs with: {pairs}"
            )

    # Daily specials
    if menu.get("daily_specials"):
        menu_lines.append("\n### 🔥 Today's Specials")
        for s in menu["daily_specials"]:
            menu_lines.append(f"- Item {s['item_id']}: {s['discount_percent']}% off — {s['note']}")

    # Combos
    if menu.get("combos"):
        menu_lines.append("\n### 🎉 Combo Deals")
        for c in menu["combos"]:
            menu_lines.append(
                f"- **{c['name']}**: {c['description']} — ${c['combo_price']:.2f} (save ${c['savings']:.2f})"
            )

    menu_section = "\n".join(menu_lines)

    # --- User context ---
    context_section = ""
    if user_context:
        context_section = (
            "\n## Returning Customer Info\n"
            f"Visit count: {user_context.get('visit_count', 1)}\n"
        )
        if user_context.get("dietary"):
            context_section += f"Dietary needs: {', '.join(user_context['dietary'])}\n"
        if user_context.get("allergies"):
            context_section += f"Allergies: {', '.join(user_context['allergies'])}\n"
        if user_context.get("preferences"):
            context_section += f"Preferences: {', '.join(user_context['preferences'])}\n"
        if user_context.get("past_orders"):
            last_orders = user_context["past_orders"][-3:]
            context_section += f"Recent past orders: {json.dumps(last_orders)}\n"
        if user_context.get("liked_items"):
            context_section += f"Liked items: {', '.join(user_context['liked_items'])}\n"
        if user_context.get("disliked_items"):
            context_section += f"Disliked items: {', '.join(user_context['disliked_items'])}\n"

    # --- Current order ---
    order_section = ""
    if current_order:
        order_section = "\n## Current Order\n" + json.dumps(current_order, indent=2)

    # --- Behavioral rules ---
    rules = """
## Your Rules
1. Be a waiter, not a chatbot. Use warm, natural language. Say "Great choice!" not "I have added the item to your order."
2. ONLY recommend items from the menu above. NEVER make up dishes that aren't listed. If asked about something not on the menu, say so and suggest something similar.
3. Recommend proactively but not aggressively. After 2-3 items, suggest a drink or dessert. Don't push on every message.
4. Remember everything the user tells you in this conversation — dietary needs, preferences, budget, mood.
5. Handle edge cases gracefully: sold-out items (suggest alternatives), items not on the menu (suggest similar), budget constraints (filter by price).
6. When recommending items, include the item ID in parentheses so the system can show rich cards. Format: mention the item name and note (id: starter-001) etc.
7. Keep the current order accurate. Confirm additions, handle modifications ("make it two", "remove that").
8. When the user seems done, offer to summarize the order.
9. If this is a returning customer (see context above), greet them personally and reference their preferences/past orders.
10. Upsell combos when relevant. If the user's order matches part of a combo, mention the savings.
11. Keep responses concise — 2-4 sentences max unless the user asks for detail. This is a chat, not an essay.
12. Use the restaurant's currency ($) when mentioning prices.
"""

    prompt = f"""{personality}

{menu_section}

{context_section}

{order_section}

{rules}
"""
    return prompt.strip()
