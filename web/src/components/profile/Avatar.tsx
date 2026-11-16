/** Foto da pessoa ou suas iniciais (porteiro reconhece pela foto, RF-020). */
export function Avatar({
  name,
  photo,
  size = "md",
}: {
  name: string
  photo: string | null
  size?: "md" | "lg"
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
  const box = size === "lg" ? "size-20 text-2xl" : "size-12 text-base"
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className={`${box} shrink-0 rounded-full object-cover`} />
  }
  return (
    <span
      aria-hidden
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-extrabold text-accent-foreground`}
    >
      {initials}
    </span>
  )
}
