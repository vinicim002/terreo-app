"use client"

import { Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Choices, TextField } from "@/components/forms/fields"
import { ErrorText } from "@/components/comm/shared"
import { serviceContext, useServiceMutation } from "@/hooks/data"
import { getServices, ServiceError } from "@/services"
import { OnArrivalSchema, StoreSchema, type OnArrival, type Store } from "@/services/schemas"

/** Novo código de entrega (mockup 09). */
export function CodeForm() {
  const t = useTranslations("fd")
  const router = useRouter()
  const [store, setStore] = useState<Store>("ifood")
  const [storeName, setStoreName] = useState("")
  const [code, setCode] = useState("")
  const [note, setNote] = useState("")
  const [onArrival, setOnArrival] = useState<OnArrival>("elevator")
  const save = useServiceMutation((confirmDuplicate: boolean) =>
    getServices().deliveries.registerCode(serviceContext(), {
      store,
      storeName: store === "other" ? storeName : null,
      code: code.trim(),
      note: note.trim() || null,
      onArrival,
      confirmDuplicate,
    }),
  )
  const submit = (confirmDuplicate = false) =>
    save.mutate(confirmDuplicate, { onSuccess: () => router.replace("/resident/deliveries/") })
  const details = save.error instanceof ServiceError ? save.error.details : undefined
  const forbidden = save.error instanceof ServiceError && save.error.code === "forbidden"

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Choices
        label={t("codeForm.store")}
        options={StoreSchema.options}
        value={store}
        onChange={setStore}
        labelOf={(s) => t(`stores.${s}`)}
      />
      {store === "other" && (
        <TextField
          label={t("codeForm.storeName")}
          value={storeName}
          onChange={setStoreName}
          maxLength={40}
        />
      )}
      <TextField label={t("codeForm.code")} value={code} onChange={setCode} maxLength={30} />
      <p className="-mt-2 flex gap-2 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
        <Lightbulb aria-hidden className="size-5 shrink-0" />
        {t(`codeForm.hints.${store}`)}
      </p>
      <TextField
        label={t("codeForm.note")}
        value={note}
        onChange={setNote}
        maxLength={140}
        placeholder={t("codeForm.notePlaceholder")}
      />
      <Choices
        label={t("codeForm.onArrival")}
        options={OnArrivalSchema.options}
        value={onArrival}
        onChange={setOnArrival}
        labelOf={(a) => t(`arrival.${a}`)}
      />
      {details?.code === "duplicate" ? (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-primary p-3">
          <p>{t("codeForm.duplicate")}</p>
          <button type="button" className="btn-outline" onClick={() => submit(true)}>
            {t("codeForm.duplicateYes")}
          </button>
        </div>
      ) : (
        save.isError && (
          <ErrorText>{forbidden ? t("deliveries.noPermission") : t("codeForm.invalid")}</ErrorText>
        )
      )}
      <button type="submit" className="btn-primary min-h-14 text-lg" disabled={save.isPending}>
        {t("codeForm.save")}
      </button>
    </form>
  )
}
