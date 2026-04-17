import json
import os
import httpx
from agent.prompts import build_system_prompt
from agent.tools import TOOL_DECLARATIONS, execute_tool

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

MAX_TOOL_ROUNDS = 5  # Prevent infinite tool-calling loops


def _verify_ssl() -> bool:
    """TLS verification for outbound Gemini calls. Defaults to True.
    Set GEMINI_VERIFY_SSL=false to disable (e.g. corporate MITM proxy)."""
    return os.getenv("GEMINI_VERIFY_SSL", "true").strip().lower() not in {"false", "0", "no"}


async def _call_gemini(api_key: str, payload: dict) -> dict:
    """Make a single call to the Gemini REST API."""
    async with httpx.AsyncClient(verify=_verify_ssl(), timeout=30.0) as client:
        resp = await client.post(
            f"{GEMINI_API_URL}?key={api_key}",
            json=payload,
        )
    if resp.status_code != 200:
        raise RuntimeError(f"Gemini API error ({resp.status_code}): {resp.text[:300]}")
    return resp.json()


async def chat(
    message: str,
    conversation_history: list[dict],
    current_order: list[dict] | None = None,
    user_context: dict | None = None,
) -> dict:
    """Send a message to the Gemini waiter agent with function calling.

    Returns a dict with:
      - reply: str (the agent's text response)
      - display_cards: list (menu item cards to show in the UI)
      - order_updates: list (changes to the order)
      - current_order: list (the final order state)
      - context_updates: dict (new facts the agent learned about the user)
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return {
            "reply": "⚠️ Gemini API key not configured. Set the GEMINI_API_KEY environment variable.",
            "display_cards": [],
            "order_updates": [],
            "current_order": current_order or [],
            "context_updates": {},
        }

    if current_order is None:
        current_order = []
    order_before = json.dumps(current_order)

    system_prompt = build_system_prompt(user_context=user_context, current_order=current_order)

    # Build contents: history + new user message
    contents = []
    for msg in conversation_history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "tools": [{"function_declarations": TOOL_DECLARATIONS}],
        "tool_config": {"function_calling_config": {"mode": "AUTO"}},
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 1024,
        },
    }

    all_display_cards: list[dict] = []
    context_updates: dict = {}

    # Tool-calling loop: Gemini may call tools, we execute and feed results back
    for _round in range(MAX_TOOL_ROUNDS):
        try:
            data = await _call_gemini(api_key, payload)
        except RuntimeError as e:
            return {
                "reply": f"⚠️ {e}",
                "display_cards": [],
                "order_updates": [],
                "current_order": current_order,
                "context_updates": {},
            }

        candidate = data.get("candidates", [{}])[0]
        content = candidate.get("content", {})
        parts = content.get("parts", [])

        # Check if the model wants to call functions
        function_calls = [p for p in parts if "functionCall" in p]

        if not function_calls:
            # No function calls — extract text response and return
            text_parts = [p.get("text", "") for p in parts if "text" in p]
            reply = "\n".join(text_parts).strip() or "I'm here to help! What can I get you?"
            break
        else:
            # Execute each function call
            model_part = {"role": "model", "parts": parts}
            function_response_parts = []

            for fc in function_calls:
                fn = fc["functionCall"]
                tool_name = fn["name"]
                args = fn.get("args", {})

                result, cards = execute_tool(tool_name, args, current_order)
                all_display_cards.extend(cards)

                # Capture context updates from the dedicated tool call
                if tool_name == "update_user_context" and isinstance(result, dict):
                    facts = result.get("facts") or {}
                    if isinstance(facts, dict):
                        for k, v in facts.items():
                            if isinstance(v, list):
                                context_updates.setdefault(k, [])
                                for item in v:
                                    if item not in context_updates[k]:
                                        context_updates[k].append(item)

                function_response_parts.append({
                    "functionResponse": {
                        "name": tool_name,
                        "response": result if isinstance(result, dict) else {"results": result},
                    }
                })

            # Add model's function call + our responses to the conversation
            contents.append(model_part)
            contents.append({"role": "user", "parts": function_response_parts})
            payload["contents"] = contents
    else:
        reply = "Sorry, I got a bit confused. Could you try asking differently?"

    # Determine order updates by diffing
    order_after = json.dumps(current_order)
    order_updates = []
    if order_before != order_after:
        order_updates = [{"action": "replace", "order": current_order}]

    return {
        "reply": reply,
        "display_cards": all_display_cards,
        "order_updates": order_updates,
        "current_order": current_order,
        "context_updates": context_updates,
    }
