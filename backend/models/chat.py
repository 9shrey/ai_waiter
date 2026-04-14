from pydantic import BaseModel
from typing import Any


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    visitor_id: str
    message: str
    conversation_history: list[ChatMessage] = []
    current_order: list[dict] = []


class DisplayCard(BaseModel):
    type: str  # "menu_item"
    item: dict


class ChatResponse(BaseModel):
    reply: str
    conversation_history: list[ChatMessage]
    display_cards: list[DisplayCard] = []
    order_updates: list[dict] = []
    current_order: list[dict] = []
