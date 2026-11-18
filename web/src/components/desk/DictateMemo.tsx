"use client"

import { Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ErrorText } from "@/components/comm/shared"
import { DictateButton } from "@/voice/DictateButton"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"

/** Ditar recado ao síndico (mockup 33, História 4): microfone grande, texto para conferir, enviar. */
export function DictateMemo() {
  const t = useTranslations("fd.dictate")
  const tc = useTranslations("fd")
  const [text, setText] = useState("")
  const send = useServiceMutation(() => getServices().memos.send(serviceContext(), text))
  return (
    <form
      className="mx-auto flex max-w-xl flex-col items-stretch gap-4 px-4 py-6"
      onSubmit={(e) => {
        e.preventDefault()
        send.mutate(undefined, { onSuccess: () => setText("") })
      }}
    >
      <p className="text-center text-muted-foreground">{t("hint")}</p>
      <DictateButton value={text} onChange={setText} mode="replace" large />
      <label htmlFor="memo" className="text-sm font-semibold">
        {t("text")}
      </label>
      <textarea
        id="memo"
        rows={5}
        maxLength={1000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="rounded-xl border-2 border-input bg-card px-4 py-3 text-lg text-card-foreground"
      />
      {send.isError && <ErrorText>{tc("error")}</ErrorText>}
      {send.isSuccess && !text && (
        <p role="status" className="font-semibold">
          {t("sent")}
        </p>
      )}
      <button
        type="submit"
        className="btn-primary min-h-14 text-lg"
        disabled={text.trim().length < 2 || send.isPending}
      >
        <Send aria-hidden className="size-6" />
        {t("send")}
      </button>
    </form>
  )
}
