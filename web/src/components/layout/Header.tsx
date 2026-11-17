"use client"

import { Accessibility, ArrowLeft, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { canGoBackInApp } from "@/navigation/history"
import { useUnreadCount } from "@/hooks/data"

interface HeaderProps {
  title: string
  subtitle?: string
  /** Telas internas mostram o botão de voltar (RF-006). */
  showBack?: boolean
  /** Para onde voltar quando não há histórico (tela aberta direto pelo endereço). */
  backHref?: string
  notificationsHref?: string
}

const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-card-foreground hover:bg-muted"

export function Header({
  title,
  subtitle,
  showBack = false,
  backHref = "/",
  notificationsHref,
}: HeaderProps) {
  const t = useTranslations()
  const router = useRouter()
  const { data: unread = 0 } = useUnreadCount(!!notificationsHref)
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
        {showBack && (
          <button
            type="button"
            className={iconButton}
            onClick={() => (canGoBackInApp() ? router.back() : router.push(backHref))}
            aria-label={t("common.back")}
          >
            <ArrowLeft aria-hidden className="size-5" />
          </button>
        )}
        {!showBack && (
          // Ícone do app (kit da marca) nas telas principais, como nos mockups.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/icon-192.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-xl"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link href="/settings/" className={iconButton} aria-label={t("nav.accessibility")}>
          <Accessibility aria-hidden className="size-5" />
        </Link>
        {notificationsHref && (
          <Link
            href={notificationsHref}
            className={`${iconButton} relative`}
            aria-label={t("comm.notifications.bell", { count: unread })}
            data-testid="bell"
          >
            <Bell aria-hidden className="size-5" />
            {unread > 0 && (
              // Contagem de não lidas (spec 003, RF-022): até "9+".
              <span
                aria-hidden
                className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold leading-5 text-primary-foreground"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  )
}
