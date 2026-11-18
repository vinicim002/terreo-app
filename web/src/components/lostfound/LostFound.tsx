"use client"

import { Plus, Search, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Badge, Empty, ErrorText, KindIcon, Tabs, useDates } from "@/components/comm/shared"
import { PhotoField } from "@/components/desk/PhotoField"
import { DictateField } from "@/voice/DictateButton"
import { serviceContext, useLostFound, useServiceMutation } from "@/hooks/data"
import type { Profile } from "@/preferences/types"
import { getServices } from "@/services"
import type { LostItemView } from "@/services/contracts"

function Item({ item, profile }: { item: LostItemView; profile: Profile }) {
  const t = useTranslations("fd.lost")
  const tc = useTranslations("fd")
  const dates = useDates()
  const [returning, setReturning] = useState(false)
  const [number, setNumber] = useState("")
  const claim = useServiceMutation(() => getServices().lostFound.claim(serviceContext(), item.id))
  const returned = useServiceMutation(() =>
    getServices().lostFound.markReturned(serviceContext(), item.id, number),
  )
  const found = useServiceMutation(() =>
    getServices().lostFound.markFound(serviceContext(), item.id),
  )
  const desk = profile === "front-desk"
  return (
    <article
      className={`flex flex-col gap-2 rounded-xl border bg-card p-3 text-card-foreground ${item.kind === "lost" ? "border-l-4 border-l-warning" : "border-border"}`}
    >
      <div className="flex items-start gap-3">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo}
            alt={item.description}
            className="size-16 rounded-xl object-cover"
          />
        ) : (
          <KindIcon
            icon={item.kind === "lost" ? Search : Tag}
            tone={item.kind === "lost" ? "muted" : "brand"}
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight">{item.description}</h3>
          {item.place && <p className="text-sm">{item.place}</p>}
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {dates.short(item.createdAt)}
            {item.kind === "found" && item.status !== "returned" && ` · ${t("atDesk")}`}
            {item.kind === "lost" &&
              item.apartment &&
              ` · ${t("lostBy", { number: item.apartment })}`}
            {item.status === "claimed" &&
              (item.mine ? (
                <Badge tone="success">{t("claimedMine")}</Badge>
              ) : (
                <Badge tone="warning">{t("claimed", { number: item.apartment ?? "" })}</Badge>
              ))}
            {item.status === "returned" && (
              <Badge>{t("returnedTo", { number: item.apartment ?? "" })}</Badge>
            )}
            {item.status === "found" && (
              <Badge>{t("foundDone", { number: item.apartment ?? "" })}</Badge>
            )}
          </p>
        </div>
      </div>
      {profile === "resident" && item.kind === "found" && item.status === "open" && (
        <button
          type="button"
          className="btn-outline self-end"
          onClick={() => claim.mutate(undefined)}
        >
          {t("itsMine")}
        </button>
      )}
      {desk && item.kind === "lost" && item.status === "open" && (
        <button
          type="button"
          className="btn-primary min-h-14"
          onClick={() => found.mutate(undefined)}
        >
          {t("foundIt")}
        </button>
      )}
      {desk && item.kind === "found" && item.status !== "returned" && !returning && (
        <button
          type="button"
          className="btn-primary min-h-14"
          onClick={() => {
            setNumber(item.status === "claimed" ? (item.apartment ?? "") : "")
            setReturning(true)
          }}
        >
          {t("markReturned")}
        </button>
      )}
      {returning && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`ret-${item.id}`} className="text-sm font-semibold">
            {t("returnTo")}
          </label>
          <input
            id={`ret-${item.id}`}
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
            className="min-h-14 rounded-xl border border-input bg-card px-4 text-2xl font-extrabold"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!number}
              onClick={() => returned.mutate(undefined)}
            >
              {t("confirm")}
            </button>
            <button type="button" className="btn-outline" onClick={() => setReturning(false)}>
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
      {(claim.isError || returned.isError || found.isError) && <ErrorText>{tc("error")}</ErrorText>}
    </article>
  )
}

function NewItem({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const t = useTranslations("fd.lost")
  const tc = useTranslations("fd")
  const [description, setDescription] = useState("")
  const [place, setPlace] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const desk = profile === "front-desk"
  const save = useServiceMutation(() =>
    desk
      ? getServices().lostFound.registerFound(serviceContext(), {
          description,
          place: place || null,
          photo,
        })
      : getServices().lostFound.reportLost(serviceContext(), { description, place: place || null }),
  )
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border p-3"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined, { onSuccess: onDone })
      }}
    >
      {desk && <PhotoField label={t("photo")} value={photo} onChange={setPhoto} />}
      {desk ? (
        <>
          <DictateField
            label={t("description")}
            value={description}
            onChange={setDescription}
            max={200}
          />
          <DictateField label={t("place")} value={place} onChange={setPlace} max={80} />
        </>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t("description")}
            <input
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-12 rounded-xl border border-input bg-card px-4 text-base font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t("lostPlace")}
            <input
              value={place}
              maxLength={80}
              onChange={(e) => setPlace(e.target.value)}
              className="min-h-12 rounded-xl border border-input bg-card px-4 text-base font-normal"
            />
          </label>
        </>
      )}
      {save.isError && <ErrorText>{tc("error")}</ErrorText>}
      <button
        type="submit"
        className="btn-primary min-h-14"
        disabled={description.trim().length < 3 || save.isPending}
      >
        {t("save")}
      </button>
    </form>
  )
}

/** Achados e perdidos (mockup 16, História 6). O síndico só vê. */
export function LostFound({ profile }: { profile: Profile }) {
  const t = useTranslations("fd.lost")
  const { data } = useLostFound()
  const [tab, setTab] = useState<"found" | "lost" | "returned">("found")
  const [adding, setAdding] = useState(false)
  const list = data?.[tab] ?? []
  const canAdd = profile === "front-desk" || profile === "resident"
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4">
      {canAdd && !adding && (
        <button
          type="button"
          className="btn-primary min-h-14 text-lg"
          onClick={() => setAdding(true)}
        >
          <Plus aria-hidden className="size-6" />
          {profile === "front-desk" ? t("registerFound") : t("reportLost")}
        </button>
      )}
      {adding && <NewItem profile={profile} onDone={() => setAdding(false)} />}
      <Tabs
        label={t("returned")}
        options={["found", "lost", "returned"] as const}
        value={tab}
        onChange={setTab}
        labelOf={(v) => (v === "returned" ? t("returned") : t(v, { count: data?.[v].length ?? 0 }))}
      />
      {data && list.length === 0 && (
        <Empty>
          {tab === "found" ? t("emptyFound") : tab === "lost" ? t("emptyLost") : t("emptyReturned")}
        </Empty>
      )}
      {list.map((item) => (
        <Item key={item.id} item={item} profile={profile} />
      ))}
    </div>
  )
}
