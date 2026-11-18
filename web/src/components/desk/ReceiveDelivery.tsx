"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Choices, Toggle } from "@/components/forms/fields"
import { ErrorText } from "@/components/comm/shared"
import { DictateField } from "@/voice/DictateButton"
import { serviceContext, useDeskApartment, useServiceMutation } from "@/hooks/data"
import { getServices, ServiceError } from "@/services"
import { PackageSizeSchema, StoreSchema, type PackageSize, type Store } from "@/services/schemas"
import { PhotoField } from "./PhotoField"

/** Receber encomenda sem código (mockup 32, História 2): foto, apartamento, tamanho, loja, avisar. */
export function ReceiveDelivery() {
  const t = useTranslations("fd")
  const router = useRouter()
  const [number, setNumber] = useState(useSearchParams().get("n") ?? "")
  const [size, setSize] = useState<PackageSize>("medium")
  const [store, setStore] = useState<Store>("amazon")
  const [storeName, setStoreName] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [notify, setNotify] = useState(true)
  const apt = useDeskApartment(number.length >= 3 ? number : null)
  const save = useServiceMutation(() =>
    getServices().deliveries.receive(serviceContext(), {
      apartmentNumber: number,
      size,
      store,
      storeName: store === "other" ? storeName : null,
      photo,
      notifyResident: notify,
    }),
  )
  const notFound = save.error instanceof ServiceError && save.error.code === "not_found"

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined, {
          onSuccess: () => router.replace(`/front-desk/apartment/?n=${number}`),
        })
      }}
    >
      <PhotoField label={t("receive.photo")} value={photo} onChange={setPhoto} />
      <div className="flex flex-col gap-1">
        <label htmlFor="apt" className="text-sm font-semibold">
          {t("receive.apartment")}
        </label>
        <input
          id="apt"
          inputMode="numeric"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
          className="min-h-14 rounded-xl border border-input bg-card px-4 text-2xl font-extrabold text-card-foreground"
        />
      </div>
      {apt.data && apt.data.people.length === 0 && (
        <p role="status" className="rounded-xl bg-warning-background p-3 text-sm text-warning">
          {t("receive.nobody")}
        </p>
      )}
      <Choices
        label={t("receive.size")}
        options={PackageSizeSchema.options}
        value={size}
        onChange={setSize}
        labelOf={(s) => t(`sizes.${s}`)}
      />
      <Choices
        label={t("receive.store")}
        options={StoreSchema.options}
        value={store}
        onChange={setStore}
        labelOf={(s) => t(`stores.${s}`)}
      />
      {store === "other" && (
        <DictateField
          label={t("receive.storeName")}
          value={storeName}
          onChange={setStoreName}
          max={40}
        />
      )}
      <Toggle
        label={t("receive.notify")}
        hint={t("receive.notifyHint")}
        checked={notify}
        onChange={setNotify}
      />
      {save.isError && <ErrorText>{notFound ? t("receive.notFound") : t("error")}</ErrorText>}
      <button
        type="submit"
        className="btn-primary min-h-14 text-lg"
        disabled={save.isPending || !number}
      >
        {t("receive.save")}
      </button>
    </form>
  )
}
