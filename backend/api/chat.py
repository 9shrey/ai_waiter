from fastapi import APIRouter

from models.chat import ChatRequest, ChatResponse, ChatMessage
from agent.waiter import chat as agent_chat

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Convert history to plain dicts for the agent
    history_dicts = [{"role": m.role, "content": m.content} for m in req.conversation_history]

    # Call Gemini agent (now returns structured dict with tools output)
    result = await agent_chat(
        message=req.message,
        conversation_history=history_dicts,
        current_order=list(req.current_order) if req.current_order else [],
        user_context=None,  # Phase 6
    )

    # Build updated history
    updated_history = list(req.conversation_history) + [
        ChatMessage(role="user", content=req.message),
        ChatMessage(role="assistant", content=result["reply"]),
    ]

    return ChatResponse(
        reply=result["reply"],
        conversation_history=updated_history,
        display_cards=result.get("display_cards", []),
        order_updates=result.get("order_updates", []),
        current_order=result.get("current_order", []),
    )
