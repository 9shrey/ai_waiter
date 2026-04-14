import json
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["order"])

CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "restaurant_config.json"


class OrderItemSchema(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int
    notes: str = ""


class WhatsAppRequest(BaseModel):
    items: list[OrderItemSchema]
    visitor_id: str = ""


@router.post("/order/whatsapp")
def generate_whatsapp_link(req: WhatsAppRequest):
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    phone = config["whatsapp_number"].replace("+", "").replace(" ", "").replace("-", "")
    currency = config.get("currency_symbol", "$")

    lines = [f"🍽️ New Order from {config['name']}", ""]
    total = 0.0
    for item in req.items:
        subtotal = item.price * item.quantity
        total += subtotal
        line = f"• {item.quantity}x {item.name} — {currency}{subtotal:.2f}"
        if item.notes:
            line += f" ({item.notes})"
        lines.append(line)

    lines.append("")
    lines.append(f"💰 Total: {currency}{total:.2f}")

    message = "\n".join(lines)
    link = f"https://wa.me/{phone}?text={quote(message)}"

    return {"whatsapp_link": link, "message": message, "total": round(total, 2)}
