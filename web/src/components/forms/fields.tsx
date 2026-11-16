"use client"

import { useId, type ReactNode } from "react"

/** Campo de texto com rótulo e erro, área de toque ≥ 48 px. */
export function TextField({
  label,
  value,
  onChange,
  error,
  autoFocus,
  maxLength,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoFocus?: boolean
  maxLength?: number
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-e` : undefined}
        className="min-h-12 rounded-xl border border-input bg-card px-4 text-card-foreground"
      />
      {error && (
        <p id={`${id}-e`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/** Escolha única em botões (tipo de morador, tipo de animal). */
export function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
  labelOf,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  labelOf: (v: T) => string
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className={`inline-flex min-h-12 cursor-pointer items-center rounded-xl border px-4 font-medium ${
              o === value
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-card-foreground"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={o === value}
              onChange={() => onChange(o)}
            />
            {labelOf(o)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Interruptor com rótulo e explicação. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 text-left text-card-foreground disabled:opacity-60"
    >
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 ${checked ? "border-primary bg-primary" : "border-input bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full transition-transform ${
            checked ? "translate-x-5 bg-primary-foreground" : "translate-x-0.5 bg-foreground"
          }`}
        />
      </span>
    </button>
  )
}

/** Confirmação em linha para ações destrutivas (RF-019). */
export function ConfirmBox({
  text,
  yes,
  no,
  onYes,
  onNo,
}: {
  text: ReactNode
  yes: string
  no: string
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div
      role="alertdialog"
      aria-label={typeof text === "string" ? text : undefined}
      className="flex flex-col gap-2 rounded-xl border-2 border-destructive bg-card p-4"
    >
      <p className="text-card-foreground">{text}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={onYes}>
          {yes}
        </button>
        <button type="button" className="btn-outline" onClick={onNo}>
          {no}
        </button>
      </div>
    </div>
  )
}

export function Status({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-xl bg-secondary p-3 text-sm font-medium text-secondary-foreground"
    >
      {children}
    </p>
  )
}
