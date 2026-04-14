import json
from pathlib import Path
from fastapi import APIRouter, Query

from models.menu import Menu, MenuItem

router = APIRouter(prefix="/api/menu", tags=["menu"])

MENU_PATH = Path(__file__).resolve().parent.parent.parent / "menu.json"


def _load_menu() -> Menu:
    data = json.loads(MENU_PATH.read_text(encoding="utf-8"))
    return Menu(**data)


@router.get("", response_model=Menu)
def get_menu():
    return _load_menu()


@router.get("/search", response_model=list[MenuItem])
def search_menu(
    q: str = Query(default="", description="Search by name or description"),
    tags: str = Query(default="", description="Comma-separated tags to filter by"),
    max_price: float | None = Query(default=None, description="Maximum price"),
    spice_max: int | None = Query(default=None, description="Max spice level (0-5)"),
):
    menu = _load_menu()
    results: list[MenuItem] = []

    tag_filters = [t.strip().lower() for t in tags.split(",") if t.strip()]
    query = q.lower().strip()

    for category in menu.categories:
        for item in category.items:
            if not item.available:
                continue
            if query and query not in item.name.lower() and query not in item.description.lower():
                continue
            if tag_filters and not any(t in [tag.lower() for tag in item.tags] for t in tag_filters):
                continue
            if max_price is not None and item.price > max_price:
                continue
            if spice_max is not None and item.spice_level > spice_max:
                continue
            results.append(item)

    return results
