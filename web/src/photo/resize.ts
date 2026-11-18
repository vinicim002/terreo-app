// Fotos reduzidas no aparelho antes de guardar: perfil (spec 002, RF-025) e comprovantes de encomendas e achados
// (spec 004, research R4), com tamanho configurável.
export const MAX_PHOTO_SIZE = 512
const QUALITY = 0.8

export function targetSize(width: number, height: number, max = MAX_PHOTO_SIZE) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

interface Decoded {
  width: number
  height: number
  close?: () => void
}

interface ResizeDeps {
  decode: (file: Blob) => Promise<Decoded>
  draw: (img: Decoded, width: number, height: number, type: string, quality: number) => string
}

const browserDeps: ResizeDeps = {
  decode: (file) => createImageBitmap(file, { imageOrientation: "from-image" }),
  draw: (img, width, height, type, quality) => {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    canvas.getContext("2d")!.drawImage(img as ImageBitmap, 0, 0, width, height)
    return canvas.toDataURL(type, quality)
  },
}

/** Tamanho dos comprovantes de encomendas e achados (spec 004). */
export const PROOF_PHOTO = { max: 1024, quality: 0.7 }

export async function resizePhoto(
  file: Blob,
  deps: ResizeDeps = browserDeps,
  options: { max?: number; quality?: number } = {},
): Promise<string> {
  const img = await deps.decode(file)
  try {
    const { width, height } = targetSize(img.width, img.height, options.max ?? MAX_PHOTO_SIZE)
    return deps.draw(img, width, height, "image/jpeg", options.quality ?? QUALITY)
  } finally {
    img.close?.()
  }
}
