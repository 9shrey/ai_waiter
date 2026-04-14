from pydantic import BaseModel


class MenuItem(BaseModel):
    id: str
    name: str
    description: str
    price: float
    image: str
    tags: list[str]
    allergens: list[str]
    spice_level: int
    pairs_with: list[str]
    available: bool


class Category(BaseModel):
    name: str
    items: list[MenuItem]


class DailySpecial(BaseModel):
    item_id: str
    discount_percent: float
    note: str


class Combo(BaseModel):
    name: str
    description: str
    items: list[str]
    combo_price: float
    savings: float


class Menu(BaseModel):
    restaurant: str
    categories: list[Category]
    daily_specials: list[DailySpecial]
    combos: list[Combo]
