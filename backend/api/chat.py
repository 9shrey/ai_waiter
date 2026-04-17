from fastapi import APIRouter

from models.chat import ChatRequest, ChatResponse, ChatMessage
from agent.waiter import chat as agent_chat
from agent.context import (
    get_or_create,
    save_context,
    apply_fact_updates,
    record_visit,
    record_order,
)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Convert history to plain dicts for the agent
    history_dicts = [{"role": m.role, "content": m.content} for m in req.conversation_history]

    # Load (or create) per-visitor context. Only bump visit_count on the first
    # message of a fresh conversation so we don't inflate it every turn.
    ctx, is_returning = get_or_create(req.visitor_id)
    is_first_turn = len(history_dicts) == 0
    if is_first_turn:
        record_visit(ctx, is_returning)

    # Pass a dict the prompt builder can render
    ctx_for_prompt = ctx.model_dump() if is_returning else None

    result = await agent_chat(
        message=req.message,
        conversation_history=history_dicts,
        current_order=list(req.current_order) if req.current_order else [],
        user_context=ctx_for_prompt,
    )

    # Persist any facts the agent extracted this turn
    fact_updates = result.get("context_updates") or {}
    if fact_updates:
        apply_fact_updates(ctx, fact_updates)

    # If the order changed, record a snapshot so we can reference it next visit
    updated_order = result.get("current_order") or []
    if updated_order:
        record_order(ctx, updated_order)

    # Always save — cheap, and captures last_seen/visit_count updates
    try:
        save_context(ctx)
    except ValueError:
        # Bad visitor_id — silently skip persistence rather than failing the chat
        pass

    # Build updated history for the client
    updated_history = list(req.conversation_history) + [
        ChatMessage(role="user", content=req.message),
        ChatMessage(role="assistant", content=result["reply"]),
    ]

    return ChatResponse(
        reply=result["reply"],
        conversation_history=updated_history,
        display_cards=result.get("display_cards", []),
        order_updates=result.get("order_updates", []),
        current_order=updated_order,
    )
