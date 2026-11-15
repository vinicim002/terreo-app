"use client"

import { useEffect, useState } from "react"
import { useOnline } from "@/hooks/useOnline"

const PLUGIN_URL = "https://vlibras.gov.br/app/vlibras-plugin.js"
const APP_URL = "https://vlibras.gov.br/app"

type VLibrasWindow = Window & { VLibras?: { Widget: new (url: string) => unknown } }

/**
 * Tradutor de Libras do governo federal (RF-019, research R3a).
 * Só carrega com internet e depois da primeira interação, para não atrasar a abertura.
 * Sem internet, o botão some; o aviso aparece em Ajustes (LibrasStatus).
 */
export function VLibras() {
  const online = useOnline()
  const [wanted, setWanted] = useState(false)

  useEffect(() => {
    const start = () => setWanted(true)
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }))
    const timer = window.setTimeout(start, 4000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, start))
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!wanted || !online || document.querySelector(`script[src="${PLUGIN_URL}"]`)) return
    const script = document.createElement("script")
    script.src = PLUGIN_URL
    script.async = true
    script.onload = () => {
      const w = window as VLibrasWindow
      if (!w.VLibras) return
      new w.VLibras.Widget(APP_URL)
      // O widget se inicializa no evento "load"; em app de página única ele já passou.
      if (document.readyState === "complete") window.dispatchEvent(new Event("load"))
    }
    document.body.appendChild(script)
  }, [wanted, online])

  return (
    <div {...{ vw: "" }} className="enabled" hidden={!online}>
      <div {...{ "vw-access-button": "" }} className="active" />
      <div {...{ "vw-plugin-wrapper": "" }}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  )
}
