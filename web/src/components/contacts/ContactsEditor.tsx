"use client"

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ErrorText, Section } from "@/components/comm/shared"
import { serviceContext, useManualContacts, useServiceMutation } from "@/hooks/data"
import { getServices } from "@/services"
import type { ContactInput, ContactView } from "@/services/contracts"
import { ServiceError } from "@/services/contracts"
import type { ContactGroup } from "@/services/schemas"
import { ShowPhoneToggle } from "./ShowPhoneToggle"

const EMPTY: ContactInput = { group: "emergency", name: "", description: null, phone: "" }

/** Síndico mantém os contatos (RF-016): acrescentar, editar, subir e descer (sem arrastar) e remover. */
export function ContactsEditor() {
  const t = useTranslations("security.contacts")
  const { data } = useManualContacts()
  const [editing, setEditing] = useState<ContactInput | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const remove = useServiceMutation((id: string) =>
    getServices().contacts.remove(serviceContext(), id),
  )
  const reorder = useServiceMutation(({ group, ids }: { group: ContactGroup; ids: string[] }) =>
    getServices().contacts.reorder(serviceContext(), group, ids),
  )

  const move = (group: ContactGroup, list: ContactView[], i: number, delta: number) => {
    const ids = list.map((c) => c.id!)
    const j = i + delta
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    reorder.mutate({ group, ids })
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4">
      <ShowPhoneToggle />
      {editing ? (
        <ContactForm initial={editing} onDone={() => setEditing(null)} />
      ) : (
        <button
          type="button"
          className="btn-primary min-h-14 self-start"
          onClick={() => setEditing(EMPTY)}
        >
          <Plus aria-hidden className="size-5" />
          {t("add")}
        </button>
      )}
      {(["building", "emergency"] as const).map((group) => {
        const list = (data ?? []).filter((c) => c.group === group)
        return (
          <Section key={group} title={t(`groups.${group}`)}>
            {list.length === 0 && <p className="text-muted-foreground">{t("none")}</p>}
            <ul className="flex flex-col gap-2">
              {list.map((c, i) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-card-foreground"
                >
                  <span className="min-w-0 flex-1 basis-40 [overflow-wrap:anywhere]">
                    <span className="block font-semibold">
                      {c.name}
                      {c.frontDesk ? ` · ${t("frontDeskBadge")}` : ""}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {[c.display, c.description].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <IconButton
                      label={t("up", { name: c.name })}
                      disabled={i === 0}
                      onClick={() => move(group, list, i, -1)}
                    >
                      <ArrowUp aria-hidden className="size-5" />
                    </IconButton>
                    <IconButton
                      label={t("down", { name: c.name })}
                      disabled={i === list.length - 1}
                      onClick={() => move(group, list, i, 1)}
                    >
                      <ArrowDown aria-hidden className="size-5" />
                    </IconButton>
                    <IconButton
                      label={t("editOne", { name: c.name })}
                      onClick={() =>
                        setEditing({
                          id: c.id!,
                          group: c.group,
                          name: c.name,
                          description: c.description,
                          phone: c.display ?? c.phone ?? "",
                          frontDesk: c.frontDesk,
                        })
                      }
                    >
                      <Pencil aria-hidden className="size-5" />
                    </IconButton>
                    <IconButton
                      label={t("remove", { name: c.name })}
                      onClick={() => setRemoving(c.id)}
                    >
                      <Trash2 aria-hidden className="size-5" />
                    </IconButton>
                  </span>
                  {removing === c.id && (
                    <div className="flex w-full flex-col gap-2 rounded-xl bg-muted p-3">
                      <p className="font-semibold">{t("confirmRemove", { name: c.name })}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => setRemoving(null)}
                        >
                          {t("keep")}
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-destructive px-4 font-semibold text-destructive-foreground"
                          onClick={() =>
                            remove.mutate(c.id!, { onSuccess: () => setRemoving(null) })
                          }
                        >
                          {t("yesRemove")}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )
      })}
      {(remove.isError || reorder.isError) && <ErrorText>{t("error")}</ErrorText>}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-card text-card-foreground hover:bg-muted disabled:opacity-40"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}

function ContactForm({ initial, onDone }: { initial: ContactInput; onDone: () => void }) {
  const t = useTranslations("security.contacts")
  const [form, setForm] = useState<ContactInput>(initial)
  const save = useServiceMutation(() => getServices().contacts.save(serviceContext(), form))
  const field = save.error instanceof ServiceError ? Object.keys(save.error.details ?? {})[0] : null
  const set = (patch: Partial<ContactInput>) => setForm((f) => ({ ...f, ...patch }))
  const input =
    "min-h-12 rounded-xl border-2 border-input bg-card px-4 text-lg text-card-foreground"

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(undefined, { onSuccess: onDone })
      }}
    >
      <h2 className="text-lg">{initial.id ? t("editTitle") : t("addTitle")}</h2>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 font-semibold">{t("group")}</legend>
        {(["emergency", "building"] as const).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={form.group === g}
            onClick={() => set({ group: g, frontDesk: g === "building" ? form.frontDesk : false })}
            className="min-h-12 rounded-xl border-2 border-border px-4 font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {t(`groups.${g}`)}
          </button>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">{t("name")}</span>
        <input
          className={input}
          maxLength={60}
          value={form.name}
          aria-invalid={field === "name"}
          onChange={(e) => set({ name: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">{t("description")}</span>
        <input
          className={input}
          maxLength={60}
          value={form.description ?? ""}
          onChange={(e) => set({ description: e.target.value || null })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">{t("phone")}</span>
        <input
          className={input}
          inputMode="tel"
          value={form.phone}
          aria-invalid={field === "phone"}
          aria-describedby="phone-hint"
          onChange={(e) => set({ phone: e.target.value })}
        />
        <span id="phone-hint" className="text-sm text-muted-foreground">
          {t("phoneHint")}
        </span>
      </label>
      {form.group === "building" && (
        <label className="flex min-h-12 items-center gap-3">
          <input
            type="checkbox"
            className="size-6"
            checked={!!form.frontDesk}
            onChange={(e) => set({ frontDesk: e.target.checked })}
          />
          <span>{t("isFrontDesk")}</span>
        </label>
      )}
      {save.isError && (
        <ErrorText>{field ? t(`invalid.${field}` as "invalid.phone") : t("error")}</ErrorText>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-outline" onClick={onDone}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn-primary" disabled={save.isPending}>
          {t("save")}
        </button>
      </div>
    </form>
  )
}
