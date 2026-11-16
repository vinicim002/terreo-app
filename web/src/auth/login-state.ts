// Celular e prazos da entrada em andamento, guardados na aba (sessionStorage) entre as duas telas.
export interface PendingLogin {
  phone: string
  resendAt: string
}

const KEY = "terreo:login"

export function savePendingLogin(value: PendingLogin) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value))
  } catch {}
}

export function readPendingLogin(): PendingLogin | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PendingLogin) : null
  } catch {
    return null
  }
}

export function clearPendingLogin() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {}
}

/** Para onde ir depois de entrar: a rota pedida antes da entrada, se houver. */
export function takeAfterLogin(fallback: string) {
  try {
    const path = sessionStorage.getItem("terreo:after-login")
    sessionStorage.removeItem("terreo:after-login")
    return path && path.startsWith("/") && !path.startsWith("/login") ? path : fallback
  } catch {
    return fallback
  }
}
