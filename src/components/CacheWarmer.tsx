"use client";

import { useEffect } from "react";

export default function CacheWarmer() {
  useEffect(() => {
    fetch("/api/mechanics/public")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          localStorage.setItem("road-rescue-mechanics", JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
