# AI Waiter Architecture

```mermaid
flowchart LR
    Guest["Guest browser"] --> Frontend["Next.js UI<br/>chat, menu cards, cart"]
    Frontend --> API["FastAPI backend"]
    API --> Gemini["Gemini function calling"]
    Gemini --> Tools["Menu/profile/cart tools"]
    Tools --> Menu["menu.json"]
    Tools --> Profile["local visitor profile"]
    Tools --> Cart["cart state"]
    Cart --> WhatsApp["WhatsApp checkout link"]
```

## Runtime Flow

1. The guest sends a natural-language food request from the chat UI.
2. FastAPI builds context from `menu.json`, `restaurant_config.json`, and the visitor profile.
3. Gemini can call structured tools for menu search, preference updates, and cart changes.
4. The frontend renders assistant text, menu cards, and live cart deltas.
5. Checkout formats the cart into a WhatsApp deep link for the restaurant.

## Evidence Fixture

Run this without an API key:

```bash
python examples/replay_order_flow.py
```

It writes `results/sample_conversation.json`, `results/cart_state.json`, and `results/whatsapp_checkout.json`.
