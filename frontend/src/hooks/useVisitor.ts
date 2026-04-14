"use client";

import { useEffect, useState } from "react";

function generateId(): string {
  return "v_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function useVisitor() {
  const [visitorId, setVisitorId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("ai_waiter_visitor_id");
    if (!id) {
      id = generateId();
      localStorage.setItem("ai_waiter_visitor_id", id);
    }
    setVisitorId(id);
  }, []);

  return visitorId;
}
