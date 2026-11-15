/** Modo do app (research R6): dev e demo têm escolha de perfil; real só terá login (Etapa 2). */
export type AppMode = "dev" | "demo" | "real"

export function getAppMode(value = process.env.NEXT_PUBLIC_APP_MODE): AppMode {
  return value === "dev" || value === "demo" ? value : "real"
}

export const APP_MODE: AppMode = getAppMode()
export const HAS_PROFILE_PICKER = APP_MODE !== "real"
