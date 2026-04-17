from pydantic import BaseModel, Field
from typing import Any


class UserContext(BaseModel):
    """Per-visitor personalization state, persisted across sessions."""
    visitor_id: str
    visit_count: int = 1
    dietary: list[str] = Field(default_factory=list)  # e.g. ["vegetarian", "vegan"]
    allergies: list[str] = Field(default_factory=list)  # e.g. ["nuts", "dairy"]
    preferences: list[str] = Field(default_factory=list)  # free-form notes
    liked_items: list[str] = Field(default_factory=list)  # item_ids
    disliked_items: list[str] = Field(default_factory=list)  # item_ids
    past_orders: list[dict[str, Any]] = Field(default_factory=list)  # list of order snapshots
    last_seen: str = ""  # ISO timestamp
