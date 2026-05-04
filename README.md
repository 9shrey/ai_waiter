# 🍽️ AI Waiter

An AI-powered conversational waiter for restaurants. Customers chat with a smart, personalized agent that knows the full menu, remembers preferences and allergies, recommends dishes, and sends the final order via WhatsApp — replacing the traditional static online menu with an interactive experience.

Built as a **demo-ready MVP** to pitch restaurant owners.

![Tech Stack](https://img.shields.io/badge/Next.js-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Gemini_AI-4285F4?logo=google&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

![AI Waiter chat and cart demo](docs/assets/chat-flow.svg)

---

## Features

### 💬 Conversational AI Waiter
- Full-screen chat interface with a warm, natural waiter personality
- Understands natural requests: *"I'm vegetarian"*, *"What pairs with butter chicken?"*, *"I'm on a budget under $15"*, *"Make it spicy"*
- Displays menu items as **rich cards** inline in the conversation (image, name, price, description)
- Powered by **Google Gemini 2.0 Flash** with function calling for structured tool use

### 🧠 Personalization Engine
- Anonymous visitors get a persistent profile via `localStorage` visitor IDs
- Automatically tracks dietary restrictions, allergies, cuisine preferences, past orders, and liked/disliked items
- Returns personalized greetings and recommendations on repeat visits:
  > *"Welcome back! Last time you loved the Paneer Tikka. Want that again?"*
  > *"I remember you're allergic to peanuts — I'll keep those out."*

### 📋 Smart Menu Browsing
- Visual menu page with categorized grid layout
- Each item has an **"Ask the waiter"** button that opens the chat pre-filled with a question about that dish
- Menu loaded from a single `menu.json` — shared source of truth for both AI and UI

### 🛒 Order Builder + WhatsApp Checkout
- Live order sidebar updated through natural conversation (*"Actually, make that two naans"*, *"Remove the raita"*)
- Shows items, quantities, prices, and running total
- **Place Order** generates a WhatsApp deep link with the formatted order, sent directly to the restaurant's number

### 📈 Smart Upselling
- Contextual, non-aggressive suggestions for add-ons, drinks, desserts, and daily specials
- Pairing intelligence built into the menu schema (`pairs_with` relationships)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| AI Agent | Google Gemini 2.0 Flash (function calling) |
| Data | JSON files (`menu.json`, `restaurant_config.json`) |
| Identity | Anonymous — `localStorage` visitor ID, no auth |
| Ordering | WhatsApp deep link checkout |
| Deployment | Docker Compose |

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md).

```mermaid
flowchart LR
    Frontend["Next.js frontend"] --> Backend["FastAPI backend"]
    Backend --> Gemini["Gemini function calls"]
    Gemini --> Tools["menu/profile/cart tools"]
    Tools --> Menu["menu.json"]
    Tools --> Cart["live cart"]
    Cart --> WhatsApp["WhatsApp handoff"]
```

---

## Project Structure

```
ai_waiter/
├── docker-compose.yml           # Orchestrates frontend + backend
├── menu.json                    # Full restaurant menu (single source of truth)
├── restaurant_config.json       # Restaurant name, WhatsApp number, theme, personality
│
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── api/
│   │   ├── chat.py              # POST /api/chat — conversation endpoint
│   │   ├── menu.py              # GET /api/menu — full menu
│   │   └── order.py             # POST /api/order/whatsapp — generate WhatsApp link
│   └── agent/
│       ├── waiter.py            # Gemini agent: system prompt, tool-calling loop
│       ├── prompts.py           # System prompt templates and personality config
│       └── tools.py             # Agent tools: search_menu, add_to_order, etc.
│
└── frontend/
    └── src/
        ├── app/                 # Next.js App Router pages
        ├── components/          # Chat, ChatMessage, MenuCard, OrderSidebar
        ├── contexts/            # Order state management
        ├── hooks/               # useChat, useVisitor
        └── lib/                 # API client and types
```

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available)

### 1. Clone the repository

```bash
git clone https://github.com/9shrey/ai_waiter.git
cd ai_waiter
```

### 2. Set up environment variables

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Configure your restaurant

Edit `restaurant_config.json` to set your restaurant's name, WhatsApp number, theme colors, and agent personality. Edit `menu.json` to define your full menu with categories, items, prices, allergens, spice levels, and pairing suggestions.

### 4. Run with Docker Compose

```bash
docker compose up --build
```

The app will be available at:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Health check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Reproduce in 5 Minutes

```bash
python examples/replay_order_flow.py
```

This runs an offline conversation replay without a Gemini key and writes:

| artifact | purpose |
|---|---|
| [`results/sample_conversation.json`](results/sample_conversation.json) | sample guest/AI conversation with menu-card IDs |
| [`results/cart_state.json`](results/cart_state.json) | live cart update produced by the replay |
| [`results/whatsapp_checkout.json`](results/whatsapp_checkout.json) | WhatsApp handoff message and deep link |
| [`examples/sample_restaurant_config.json`](examples/sample_restaurant_config.json) | sample restaurant configuration |
| [`examples/sample_menu.json`](examples/sample_menu.json) | sample menu data |

### Running without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Menu Schema

Each menu item supports rich metadata for intelligent recommendations:

```json
{
  "id": "starter-001",
  "name": "Paneer Tikka",
  "description": "Marinated cottage cheese grilled in tandoor...",
  "price": 12.99,
  "image": "/images/paneer-tikka.jpg",
  "tags": ["vegetarian", "gluten-free", "popular"],
  "allergens": ["dairy"],
  "spice_level": 2,
  "pairs_with": ["naan-001", "lassi-001"],
  "available": true
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/menu` | Returns the full menu |
| `POST` | `/api/chat` | Send a message, get AI response with cards and order updates |
| `POST` | `/api/order/whatsapp` | Generate a WhatsApp deep link for the current order |
| `GET` | `/api/health` | Health check |

---

## Limitations

- No payments, POS integration, table management, or kitchen display integration.
- Visitor identity is localStorage-based and anonymous; there is no account system.
- Allergy and dietary recommendations must be verified by restaurant staff before real-world use.
- WhatsApp checkout is a handoff, not a confirmed order lifecycle with payment and fulfillment state.
- Gemini output quality depends on prompt and menu data quality; fallback behavior should be tightened before production.

---

## License

This project is for demonstration purposes.
