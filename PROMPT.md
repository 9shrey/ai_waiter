# AI Waiter — MVP Build Prompt

## What I'm Building

A web-based **AI waiter** for restaurants. Instead of a static online menu, customers interact with a conversational AI agent that behaves like a knowledgeable, personalized waiter. The agent knows the full menu, remembers returning customers' preferences/allergies, makes tailored recommendations, suggests combos and upsells, and sends the final order via WhatsApp.

This is a **demo-ready MVP** I'll use to pitch restaurant owners. It needs to look polished, feel magical, and be dead simple for a restaurant to configure.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | **Next.js** (App Router, TypeScript, Tailwind CSS) |
| Backend / API | **Python + FastAPI** |
| AI Agent | **Google Gemini** (via `google-generativeai` SDK) — I have free Pro for 1 year |
| Menu Storage | **JSON file** for MVP (design schema so it's easy to migrate to Postgres later) |
| User Identity | **Anonymous** — use `localStorage` to persist a unique visitor ID + conversation history + preferences. No auth. |
| Ordering | AI builds an order → user confirms → **WhatsApp deep link** sends the final order to the restaurant's number |
| Deployment | **Docker Compose** (frontend + backend in a single `docker-compose.yml`) |
| Target | **Single restaurant** for the demo |

---

## Core Features (MVP Scope)

### 1. Conversational AI Waiter
- Full-screen chat interface (think ChatGPT-style, but themed for a restaurant)
- The agent has the **complete menu** injected into its system prompt (from `menu.json`)
- Natural, warm, waiter-like personality — not robotic. Knows when to recommend, when to upsell, when to just answer
- Supports: "What's good here?", "I'm vegetarian", "What goes well with the butter chicken?", "I'm allergic to nuts", "What's popular?", "Make it spicy", "I'm on a budget under $15"
- The agent should be able to show menu items **inline in chat** as rich cards (image, name, price, description) — not just plain text

### 2. Personalization Engine (Per-User Context)
- Each anonymous visitor gets a **context file** (or JSON blob) stored on the backend, keyed by their `localStorage` visitor ID
- The context tracks:
  - Dietary restrictions / allergies (extracted from conversation)
  - Cuisine preferences (extracted from conversation)
  - Past orders
  - Liked / disliked items
  - Visit count
- On return visits, the agent **automatically loads this context** and uses it:
  - "Welcome back! Last time you loved the Paneer Tikka. Want that again, or try something new?"
  - "I remember you're allergic to peanuts — I'll keep those dishes out of my suggestions."
- Context is updated after every conversation (agent extracts key facts and appends to context)

### 3. Smart Menu Browsing
- A **visual menu page** (grid of categories → items with images/prices) that users can browse traditionally
- Each menu item has an "Ask the waiter about this" button that opens the chat pre-filled with a question about that dish
- Menu is loaded from `menu.json` — single source of truth for both the agent and the UI

### 4. Order Builder + WhatsApp Checkout
- As the user chats, the agent builds an **order summary** in a sidebar/drawer
- User can add/remove/modify items through conversation ("Actually, make that two naans" / "Remove the raita")
- The order panel shows: items, quantities, individual prices, total
- "Place Order" button generates a **WhatsApp deep link** (`https://wa.me/<number>?text=<encoded_order>`) that opens WhatsApp with the full order pre-filled, sent to the restaurant's configured number
- No payment processing for MVP

### 5. Upselling & Combo Intelligence
- The agent proactively suggests:
  - Add-ons ("Want to add garlic naan with that curry? Most people love the combo")
  - Drinks ("A mango lassi pairs perfectly with spicy dishes")
  - Desserts ("Save room for the gulab jamun — it's our best seller")
  - Daily specials (configurable in `menu.json`)
- Upsell behavior is **subtle and natural**, not aggressive. Triggered contextually.

---

## Project Structure

```
ai_waiter/
├── docker-compose.yml
├── README.md
├── menu.json                    # Single source of truth for the menu
├── restaurant_config.json       # Restaurant name, WhatsApp number, theme colors, personality tweaks
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                  # FastAPI app entry
│   ├── api/
│   │   ├── chat.py              # POST /chat — send message, get agent response
│   │   ├── menu.py              # GET /menu — return full menu
│   │   └── order.py             # POST /order/whatsapp — generate WhatsApp link
│   ├── agent/
│   │   ├── waiter.py            # Core agent logic: system prompt construction, Gemini calls, tool use
│   │   ├── prompts.py           # System prompt templates, personality config
│   │   ├── context.py           # Load/save/update per-user context files
│   │   └── tools.py             # Agent tools: search_menu, add_to_order, get_recommendations, etc.
│   ├── models/
│   │   ├── menu.py              # Pydantic models for menu items, categories
│   │   ├── order.py             # Pydantic models for order state
│   │   └── context.py           # Pydantic models for user context
│   └── user_contexts/           # Per-user JSON context files (created at runtime)
│       └── {visitor_id}.json
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── public/
│   │   └── images/              # Menu item images
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout with restaurant branding
│       │   ├── page.tsx         # Landing → chat interface
│       │   └── menu/
│       │       └── page.tsx     # Visual menu browsing page
│       ├── components/
│       │   ├── Chat.tsx         # Main chat window
│       │   ├── ChatMessage.tsx  # Single message bubble (supports rich menu cards)
│       │   ├── MenuCard.tsx     # Rich menu item card (reused in chat + menu page)
│       │   ├── OrderSidebar.tsx # Current order summary drawer
│       │   ├── OrderItem.tsx    # Single item in order
│       │   └── WhatsAppButton.tsx # Place order via WhatsApp
│       ├── hooks/
│       │   ├── useChat.ts       # Chat state management, API calls
│       │   ├── useOrder.ts      # Order state management
│       │   └── useVisitor.ts    # Visitor ID generation + localStorage persistence
│       ├── lib/
│       │   ├── api.ts           # Backend API client
│       │   └── types.ts         # Shared TypeScript types
│       └── styles/
│           └── globals.css
```

---

## Menu JSON Schema

```json
{
  "restaurant": "Taste of India",
  "categories": [
    {
      "name": "Starters",
      "items": [
        {
          "id": "starter-001",
          "name": "Paneer Tikka",
          "description": "Marinated cottage cheese grilled in tandoor with bell peppers and onions",
          "price": 12.99,
          "image": "/images/paneer-tikka.jpg",
          "tags": ["vegetarian", "gluten-free", "popular"],
          "allergens": ["dairy"],
          "spice_level": 2,
          "pairs_with": ["naan-001", "lassi-001"],
          "available": true
        }
      ]
    }
  ],
  "daily_specials": [
    {
      "item_id": "curry-003",
      "discount_percent": 15,
      "note": "Chef's special today!"
    }
  ],
  "combos": [
    {
      "name": "Curry Combo",
      "items": ["curry-001", "naan-001", "rice-001"],
      "combo_price": 18.99,
      "savings": 4.00
    }
  ]
}
```

---

## Agent Behavior Specification

### System Prompt Structure
```
[Restaurant personality from restaurant_config.json]
[Full menu data from menu.json]
[User context from user_contexts/{visitor_id}.json — if exists]
[Current order state — if any items added]
[Available tools the agent can call]
[Behavioral rules — see below]
```

### Behavioral Rules for the Agent
1. **Be a waiter, not a chatbot.** Use warm, natural language. Say "Great choice!" not "I have added the item to your order."
2. **Always be helpful about the menu.** If asked about ingredients, allergies, spice levels — answer from the menu data. Never hallucinate menu items that don't exist.
3. **Recommend proactively but not aggressively.** After 2-3 items ordered, suggest a drink or dessert. Don't push on every message.
4. **Remember everything the user tells you** — dietary needs, preferences, budget. Extract these silently and save to context.
5. **Handle edge cases gracefully:** out-of-stock items ("Sorry, that's not available today — but have you tried X?"), items not on the menu ("We don't have that, but here's something similar"), budget constraints ("Here's what I'd recommend under $15").
6. **When showing menu items, use the structured tool** so the frontend can render rich cards — don't just list text.
7. **Keep the current order accurate.** Confirm additions, handle modifications ("make it two", "actually remove that", "change to medium spice").
8. **At the end of the conversation, generate an order summary** and prompt the user to place via WhatsApp.
9. **On return visits, greet personally** and reference past preferences/orders.
10. **Upsell combos when relevant:** "If you add a naan and rice to that curry, you'd save $4 with our Curry Combo!"

### Agent Tools (Function Calling)
- `search_menu(query, filters)` — Search menu items by name, tags, dietary needs, price range, spice level
- `get_item_details(item_id)` — Get full details of a specific menu item
- `add_to_order(item_id, quantity, notes)` — Add item to current order
- `remove_from_order(item_id)` — Remove item from order
- `modify_order_item(item_id, changes)` — Modify quantity or notes
- `get_order_summary()` — Return current order with total
- `get_recommendations(criteria)` — Get AI-powered recommendations based on criteria
- `check_combo_eligibility(order)` — Check if current order qualifies for any combos
- `update_user_context(facts)` — Save learned preferences/allergies to user context

---

## Restaurant Config Schema

```json
{
  "name": "Taste of India",
  "tagline": "Authentic Indian Cuisine Since 1995",
  "whatsapp_number": "+1234567890",
  "currency": "USD",
  "currency_symbol": "$",
  "theme": {
    "primary_color": "#D4451A",
    "secondary_color": "#F5E6CC",
    "font": "Playfair Display"
  },
  "agent_personality": "You are the friendly waiter at Taste of India. You're warm, knowledgeable about Indian cuisine, and love helping people discover new flavors. You speak casually but respectfully. You know the regulars and make everyone feel welcome.",
  "operating_hours": "11:00 AM - 10:00 PM",
  "order_minimum": 10.00
}
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Send user message + visitor_id + current order state → get agent response + updated order + display cards |
| `GET` | `/api/menu` | Get full menu (for visual menu page) |
| `GET` | `/api/menu/search?q=...&tags=...` | Search/filter menu items |
| `POST` | `/api/order/whatsapp` | Generate WhatsApp deep link from order |
| `GET` | `/api/config` | Get restaurant config (name, theme, etc.) for frontend |

### Chat API Request/Response

**Request:**
```json
{
  "visitor_id": "abc-123-def",
  "message": "What's good for a vegetarian?",
  "conversation_history": [...],
  "current_order": [...]
}
```

**Response:**
```json
{
  "reply": "Great question! We have some amazing vegetarian options...",
  "display_cards": [
    { "type": "menu_item", "item": { "id": "starter-001", ... } },
    { "type": "menu_item", "item": { "id": "curry-002", ... } }
  ],
  "order_updates": [
    { "action": "add", "item_id": "starter-001", "quantity": 1 }
  ],
  "context_updates": {
    "dietary": ["vegetarian"]
  }
}
```

---

## Key UX Decisions

1. **Chat-first landing page.** The first thing users see is the chat with a greeting: "Hey! Welcome to Taste of India. What are you in the mood for today?" + quick-action buttons ("Show me the menu", "I need recommendations", "What's popular?")
2. **Order sidebar slides out** from the right when items are added — always visible but not intrusive
3. **Mobile-first design** — most users will be on their phones at/near the restaurant
4. **Streaming responses** — agent responses should stream in token-by-token for a natural feel (use SSE)
5. **Quick-reply chips** — after each agent message, show 2-3 contextual quick-reply buttons ("Add to order", "Tell me more", "Something else")
6. **Dark/warm theme** by default — restaurant ambiance feel, configurable via restaurant_config.json

---

## Implementation Order (Build Sequence)

1. **Phase 1 — Skeleton:** Docker Compose + FastAPI hello world + Next.js hello world, both containerized and talking to each other
2. **Phase 2 — Menu:** Create `menu.json` with sample Indian restaurant data (15-20 items across 5 categories). Build visual menu page. Build `/api/menu` endpoint.
3. **Phase 3 — Chat Core:** Build chat UI (frontend). Build `/api/chat` endpoint with Gemini integration. Inject menu into system prompt. Get basic Q&A working.
4. **Phase 4 — Agent Tools:** Implement function calling — search_menu, add_to_order, get_recommendations. Rich card rendering in chat.
5. **Phase 5 — Order Flow:** Order sidebar, order state management, WhatsApp checkout link generation.
6. **Phase 6 — Personalization:** Visitor ID system, per-user context files, context loading/saving, return-visit greeting.
7. **Phase 7 — Polish:** Streaming responses, quick-reply chips, upsell logic, combo detection, mobile responsiveness, loading states, error handling.

---

## Non-Goals (Explicitly Out of Scope for MVP)
- Payment processing
- User authentication / accounts
- Multi-restaurant support
- Admin dashboard for menu management
- Real-time order tracking
- Database (Postgres) — using JSON files for now
- Analytics
- Multi-language support
- Voice input

---

## Demo Script (What I'll Show Restaurant Owners)

1. Open the website → warm greeting from the AI waiter
2. "I'm vegetarian and allergic to nuts" → agent acknowledges + filters recommendations
3. "What do you recommend?" → shows 3-4 rich cards with images, tailored to vegetarian + nut-free
4. "I'll take the paneer tikka" → added to order, sidebar slides out
5. "What goes well with that?" → suggests naan + lassi, mentions combo deal
6. "Add those too" → order updated, combo price applied
7. "That's it" → order summary, WhatsApp button sends the order
8. **Close tab. Open again.** → "Welcome back! Want your usual — Paneer Tikka with garlic naan?"

**That last step is the mic drop.**
