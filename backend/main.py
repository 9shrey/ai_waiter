from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.menu import router as menu_router
from api.chat import router as chat_router
from api.order import router as order_router

app = FastAPI(title="AI Waiter API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu_router)
app.include_router(chat_router)
app.include_router(order_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ai-waiter-backend"}
