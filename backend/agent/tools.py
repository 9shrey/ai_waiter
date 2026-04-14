"""Agent tools that Gemini can call via function calling.

These are pure functions that operate on menu data and order state.
They are called by the waiter agent during a conversation.
"""

import json
from pathlib import Path
from models.menu import Menu, MenuItem

MENU_PATH = Path(__file__).resolve().parent.parent.parent / "menu.json"
_menu_cache: Menu | None = None


def _load_menu() -> Menu:
    global _menu_cache
    if _menu_cache is None:
        data = json.loads(MENU_PATH.read_text(encoding="utf-8"))
        _menu_cache = Menu(**data)
    return _menu_cache


def search_menu(query: str = "", tags: str = "", max_price: float | None = None, spice_max: int | None = None) -> list[dict]:
    """Search menu items by name/description, tags, price, or spice level."""
    menu = _load_menu()
    results = []
    tag_filters = [t.strip().lower() for t in tags.split(",") if t.strip()]
    q = query.lower().strip()

    for cat in menu.categories:
        for item in cat.items:
            if not item.available:
                continue
            if q and q not in item.name.lower() and q not in item.description.lower():
                continue
            if tag_filters and not any(t in [tag.lower() for tag in item.tags] for t in tag_filters):
                continue
            if max_price is not None and item.price > max_price:
                continue
            if spice_max is not None and item.spice_level > spice_max:
                continue
            results.append(item.model_dump())
    return results


def get_item_details(item_id: str) -> dict | None:
    """Get full details of a specific menu item by its ID."""
    menu = _load_menu()
    for cat in menu.categories:
        for item in cat.items:
            if item.id == item_id:
                return {**item.model_dump(), "category": cat.name}
    return None


def add_to_order(current_order: list[dict], item_id: str, quantity: int = 1, notes: str = "") -> dict:
    """Add an item to the current order. Returns the updated order and a confirmation."""
    item_data = get_item_details(item_id)
    if not item_data:
        return {"success": False, "message": f"Item {item_id} not found on the menu."}

    # Check if already in order
    for entry in current_order:
        if entry["item_id"] == item_id:
            entry["quantity"] += quantity
            if notes:
                entry["notes"] = notes
            total = sum(e["price"] * e["quantity"] for e in current_order)
            return {
                "success": True,
                "message": f"Updated {item_data['name']} to quantity {entry['quantity']}.",
                "order": current_order,
                "total": round(total, 2),
            }

    new_entry = {
        "item_id": item_id,
        "name": item_data["name"],
        "price": item_data["price"],
        "quantity": quantity,
        "notes": notes,
    }
    current_order.append(new_entry)
    total = sum(e["price"] * e["quantity"] for e in current_order)
    return {
        "success": True,
        "message": f"Added {quantity}x {item_data['name']} to your order.",
        "order": current_order,
        "total": round(total, 2),
    }


def remove_from_order(current_order: list[dict], item_id: str) -> dict:
    """Remove an item from the current order."""
    for i, entry in enumerate(current_order):
        if entry["item_id"] == item_id:
            removed = current_order.pop(i)
            total = sum(e["price"] * e["quantity"] for e in current_order)
            return {
                "success": True,
                "message": f"Removed {removed['name']} from your order.",
                "order": current_order,
                "total": round(total, 2),
            }
    return {"success": False, "message": "That item isn't in your order."}


def modify_order_item(current_order: list[dict], item_id: str, quantity: int | None = None, notes: str | None = None) -> dict:
    """Modify quantity or notes of an order item."""
    for entry in current_order:
        if entry["item_id"] == item_id:
            if quantity is not None:
                if quantity <= 0:
                    return remove_from_order(current_order, item_id)
                entry["quantity"] = quantity
            if notes is not None:
                entry["notes"] = notes
            total = sum(e["price"] * e["quantity"] for e in current_order)
            return {
                "success": True,
                "message": f"Updated {entry['name']} — qty: {entry['quantity']}.",
                "order": current_order,
                "total": round(total, 2),
            }
    return {"success": False, "message": "That item isn't in your order."}


def get_order_summary(current_order: list[dict]) -> dict:
    """Get the current order summary with itemized list and total."""
    if not current_order:
        return {"items": [], "total": 0, "message": "Your order is empty."}

    total = sum(e["price"] * e["quantity"] for e in current_order)
    return {
        "items": current_order,
        "total": round(total, 2),
        "item_count": sum(e["quantity"] for e in current_order),
    }


def get_recommendations(criteria: str = "") -> list[dict]:
    """Get menu recommendations based on criteria like 'vegetarian', 'spicy', 'budget', etc."""
    menu = _load_menu()
    criteria_lower = criteria.lower()
    scored: list[tuple[int, dict]] = []

    for cat in menu.categories:
        for item in cat.items:
            if not item.available:
                continue
            score = 0
            # Boost popular / best-seller items
            if "popular" in item.tags:
                score += 3
            if "best-seller" in item.tags:
                score += 5
            # Match criteria to tags
            for tag in item.tags:
                if tag.lower() in criteria_lower:
                    score += 4
            # Match criteria to description
            if criteria_lower and criteria_lower in item.description.lower():
                score += 2
            if criteria_lower and criteria_lower in item.name.lower():
                score += 3
            # Budget filter
            if "budget" in criteria_lower and item.price < 10:
                score += 3
            if score > 0:
                scored.append((score, item.model_dump()))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:5]]


def check_combo_eligibility(current_order: list[dict]) -> list[dict]:
    """Check if the current order items qualify for any combo deals."""
    menu = _load_menu()
    order_ids = {e["item_id"] for e in current_order}
    eligible = []

    for combo in menu.combos:
        combo_ids = set(combo.items)
        overlap = order_ids & combo_ids
        missing = combo_ids - order_ids
        if len(overlap) >= 1:
            eligible.append({
                "combo_name": combo.name,
                "combo_description": combo.description,
                "combo_price": combo.combo_price,
                "savings": combo.savings,
                "already_have": list(overlap),
                "still_need": list(missing),
                "complete": len(missing) == 0,
            })

    return eligible


# --- Gemini Function Declarations ---
# These define the tool schemas that Gemini can call

TOOL_DECLARATIONS = [
    {
        "name": "search_menu",
        "description": "Search menu items by name, description, tags (vegetarian, vegan, popular, etc.), maximum price, or spice level. Returns matching menu items with full details.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search text to match against item name or description"},
                "tags": {"type": "string", "description": "Comma-separated tags to filter by (e.g. 'vegetarian,gluten-free')"},
                "max_price": {"type": "number", "description": "Maximum price filter"},
                "spice_max": {"type": "integer", "description": "Maximum spice level (0-5)"},
            },
            "required": [],
        },
    },
    {
        "name": "get_item_details",
        "description": "Get full details of a specific menu item by its ID, including category, allergens, pairings, etc.",
        "parameters": {
            "type": "object",
            "properties": {
                "item_id": {"type": "string", "description": "The menu item ID (e.g. 'curry-001')"},
            },
            "required": ["item_id"],
        },
    },
    {
        "name": "add_to_order",
        "description": "Add a menu item to the customer's current order. Use this when the customer says they want something.",
        "parameters": {
            "type": "object",
            "properties": {
                "item_id": {"type": "string", "description": "The menu item ID to add"},
                "quantity": {"type": "integer", "description": "Number of this item to add (default 1)"},
                "notes": {"type": "string", "description": "Special notes (e.g. 'extra spicy', 'no onions')"},
            },
            "required": ["item_id"],
        },
    },
    {
        "name": "remove_from_order",
        "description": "Remove an item from the customer's current order.",
        "parameters": {
            "type": "object",
            "properties": {
                "item_id": {"type": "string", "description": "The menu item ID to remove"},
            },
            "required": ["item_id"],
        },
    },
    {
        "name": "modify_order_item",
        "description": "Change the quantity or notes of an item already in the order.",
        "parameters": {
            "type": "object",
            "properties": {
                "item_id": {"type": "string", "description": "The menu item ID to modify"},
                "quantity": {"type": "integer", "description": "New quantity"},
                "notes": {"type": "string", "description": "Updated special notes"},
            },
            "required": ["item_id"],
        },
    },
    {
        "name": "get_order_summary",
        "description": "Get the current order summary with all items, quantities, prices, and total.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_recommendations",
        "description": "Get personalized menu recommendations. Pass criteria like 'vegetarian', 'spicy', 'budget', 'seafood', etc.",
        "parameters": {
            "type": "object",
            "properties": {
                "criteria": {"type": "string", "description": "What the customer is looking for (e.g. 'vegetarian and spicy')"},
            },
            "required": ["criteria"],
        },
    },
    {
        "name": "check_combo_eligibility",
        "description": "Check if the current order qualifies for any combo deals to save money.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]


def execute_tool(tool_name: str, args: dict, current_order: list[dict]) -> tuple[dict | list, list[dict]]:
    """Execute a tool call and return (result, display_cards).
    
    display_cards are menu items that should be rendered as rich cards in the frontend.
    """
    display_cards = []

    if tool_name == "search_menu":
        results = search_menu(**args)
        display_cards = [{"type": "menu_item", "item": r} for r in results[:4]]
        return {"results": results, "count": len(results)}, display_cards

    elif tool_name == "get_item_details":
        result = get_item_details(**args)
        if result:
            display_cards = [{"type": "menu_item", "item": result}]
        return result or {"error": "Item not found"}, display_cards

    elif tool_name == "add_to_order":
        result = add_to_order(current_order, **args)
        return result, display_cards

    elif tool_name == "remove_from_order":
        result = remove_from_order(current_order, **args)
        return result, display_cards

    elif tool_name == "modify_order_item":
        result = modify_order_item(current_order, **args)
        return result, display_cards

    elif tool_name == "get_order_summary":
        result = get_order_summary(current_order)
        return result, display_cards

    elif tool_name == "get_recommendations":
        results = get_recommendations(**args)
        display_cards = [{"type": "menu_item", "item": r} for r in results[:4]]
        return {"recommendations": results, "count": len(results)}, display_cards

    elif tool_name == "check_combo_eligibility":
        results = check_combo_eligibility(current_order)
        return {"combos": results}, display_cards

    return {"error": f"Unknown tool: {tool_name}"}, display_cards
