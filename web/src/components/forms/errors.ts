import { ServiceError } from "@/services"

/** Chave de tradução para um erro de serviço (celular em uso, inválido...). */
export function errorKey(error: unknown): string {
  if (error instanceof ServiceError) {
    if (error.details?.phone === "in_use") return "phone.in_use"
    if (error.details?.phone === "invalid") return "phone.invalid"
    if (error.code === "forbidden") return "household.onlyResponsible"
    if (error.code === "not_found") return "household.notFound"
  }
  return "household.error"
}

/** Dias desde uma data (para "enviado há N dias"). */
export function daysSince(iso: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86_400_000))
}
