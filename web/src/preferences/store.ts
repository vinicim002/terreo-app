"use client"

import { useCallback, useSyncExternalStore } from "react"
import { applyToDocument } from "./apply"
import {
  DEFAULT_PREFERENCES,
  isStorageAvailable,
  readPreferences,
  writePreferences,
} from "./storage"
import { PREFS_KEY, type DevicePreferences } from "./types"

type Listener = () => void

let current: DevicePreferences | null = null
let storageOk = true
const listeners = new Set<Listener>()

function systemDark() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  } catch {
    return false
  }
}

function load(): DevicePreferences {
  if (current) return current
  storageOk = isStorageAvailable()
  current = readPreferences(storageOk ? window.localStorage : null, navigator.language)
  return current
}

function emit() {
  for (const listener of listeners) listener()
}

export function setPreferences(patch: Partial<DevicePreferences>) {
  const next = { ...load(), ...patch }
  current = next
  writePreferences(storageOk ? window.localStorage : null, next)
  applyToDocument(next, systemDark())
  emit()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PREFS_KEY) return
    current = null
    applyToDocument(load(), systemDark())
    emit()
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const onMedia = () => {
    // "Seguir o celular": acompanha a mudança do sistema em tempo real (H2-4).
    applyToDocument(load(), media.matches)
    emit()
  }
  window.addEventListener("storage", onStorage)
  media.addEventListener("change", onMedia)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
    media.removeEventListener("change", onMedia)
  }
}

/** Preferências do aparelho. No build estático (sem navegador) devolve os padrões. */
export function usePreferences() {
  const prefs = useSyncExternalStore(subscribe, load, () => DEFAULT_PREFERENCES)
  const update = useCallback((patch: Partial<DevicePreferences>) => setPreferences(patch), [])
  return [prefs, update] as const
}

export function useStorageAvailable() {
  return useSyncExternalStore(
    () => () => {},
    () => (load(), storageOk),
    () => true,
  )
}
