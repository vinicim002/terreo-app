"use client"

import { useEffect } from "react"
import { APP_MODE } from "@/config/app-mode"

/** Registra o service worker fora do modo dev (no next dev ele atrapalharia a recarga). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (APP_MODE === "dev" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("Não foi possível registrar o service worker.", error)
    })
  }, [])
  return null
}
