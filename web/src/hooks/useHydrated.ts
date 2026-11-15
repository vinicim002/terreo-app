"use client"

import { useSyncExternalStore } from "react"

const noop = () => () => {}

/** false no HTML gerado no build e na hidratação; true depois, já com os dados do aparelho. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
