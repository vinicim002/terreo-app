"use client"

import { useSession } from "./session"

/** Quem está conectado e, se for morador, o apartamento e o cadastro dele. */
export function useMe() {
  const state = useSession()
  const session = state.status === "ready" ? state.session : null
  const role = session?.activeRole ?? null
  return {
    session,
    person: session?.person ?? null,
    role,
    apartmentId: role?.kind === "resident" ? role.apartmentId : undefined,
    residencyId: role?.kind === "resident" ? role.residencyId : undefined,
    apartmentNumber:
      role?.kind === "resident" ? session?.apartmentNumbers[role.apartmentId] : undefined,
  }
}
