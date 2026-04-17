"""Per-visitor context persistence.

Stores one JSON file per visitor_id under backend/user_contexts/.
Thread-safe enough for the MVP's single-worker use case.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from models.context import UserContext

CONTEXT_DIR = Path(__file__).resolve().parent.parent / "user_contexts"
_VALID_ID = re.compile(r"^[A-Za-z0-9_\-]{1,64}$")


def _path_for(visitor_id: str) -> Path:
    # Defensive: reject anything that isn't a safe token to prevent path traversal.
    if not visitor_id or not _VALID_ID.match(visitor_id):
        raise ValueError(f"Invalid visitor_id: {visitor_id!r}")
    return CONTEXT_DIR / f"{visitor_id}.json"


def load_context(visitor_id: str) -> UserContext | None:
    """Load context for a visitor. Returns None if they haven't been seen before."""
    try:
        path = _path_for(visitor_id)
    except ValueError:
        return None
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return UserContext(**data)
    except (json.JSONDecodeError, ValueError):
        return None


def save_context(ctx: UserContext) -> None:
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)
    path = _path_for(ctx.visitor_id)
    path.write_text(ctx.model_dump_json(indent=2), encoding="utf-8")


def get_or_create(visitor_id: str) -> tuple[UserContext, bool]:
    """Return (context, is_returning_visitor)."""
    existing = load_context(visitor_id)
    if existing:
        return existing, True
    return UserContext(visitor_id=visitor_id), False


def _merge_list(existing: list[str], additions: Any) -> list[str]:
    """Merge a list of strings, deduplicated and case-insensitive, preserving order."""
    if not additions:
        return existing
    if isinstance(additions, str):
        additions = [additions]
    if not isinstance(additions, list):
        return existing
    seen_lower = {x.lower() for x in existing}
    out = list(existing)
    for item in additions:
        if not isinstance(item, str):
            continue
        item = item.strip()
        if item and item.lower() not in seen_lower:
            out.append(item)
            seen_lower.add(item.lower())
    return out


def apply_fact_updates(ctx: UserContext, facts: dict[str, Any]) -> UserContext:
    """Merge agent-extracted facts into the context. Safe to call repeatedly."""
    if not isinstance(facts, dict):
        return ctx
    ctx.dietary = _merge_list(ctx.dietary, facts.get("dietary"))
    ctx.allergies = _merge_list(ctx.allergies, facts.get("allergies"))
    ctx.preferences = _merge_list(ctx.preferences, facts.get("preferences"))
    ctx.liked_items = _merge_list(ctx.liked_items, facts.get("liked_items"))
    ctx.disliked_items = _merge_list(ctx.disliked_items, facts.get("disliked_items"))
    return ctx


def record_visit(ctx: UserContext, is_returning: bool) -> UserContext:
    if is_returning:
        ctx.visit_count += 1
    ctx.last_seen = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return ctx


def record_order(ctx: UserContext, order: list[dict[str, Any]]) -> UserContext:
    """Append a completed/current order snapshot; keep the last 10."""
    if not order:
        return ctx
    snapshot = {
        "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "items": [
            {
                "item_id": i.get("item_id"),
                "name": i.get("name"),
                "quantity": i.get("quantity", 1),
            }
            for i in order
        ],
    }
    ctx.past_orders = (ctx.past_orders + [snapshot])[-10:]
    # Also promote ordered items to liked_items (soft signal).
    for i in order:
        iid = i.get("item_id")
        if iid and iid not in ctx.liked_items and iid not in ctx.disliked_items:
            ctx.liked_items.append(iid)
    return ctx
