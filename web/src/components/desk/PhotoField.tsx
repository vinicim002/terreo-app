"use client"

import { Camera, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { PROOF_PHOTO, resizePhoto } from "@/photo/resize"

/** Foto de comprovante pela câmera, reduzida no aparelho (spec 004, research R4). */
export function PhotoField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (v: string | null) => void
}) {
  const t = useTranslations("fd.receive")
  const id = useId()
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label} className="max-h-56 w-full rounded-xl object-cover" />
      ) : null}
      <div className="flex gap-2">
        <label
          htmlFor={id}
          className="inline-flex min-h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-card px-4 text-lg font-semibold"
        >
          <Camera aria-hidden className="size-6" />
          {busy ? "…" : value ? t("retake") : t("takePhoto")}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-4 font-semibold"
          >
            <X aria-hidden className="size-5" />
            {t("removePhoto")}
          </button>
        )}
      </div>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        data-testid="photo-input"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setBusy(true)
          try {
            onChange(await resizePhoto(file, undefined, PROOF_PHOTO))
          } finally {
            setBusy(false)
            e.target.value = ""
          }
        }}
      />
    </div>
  )
}
