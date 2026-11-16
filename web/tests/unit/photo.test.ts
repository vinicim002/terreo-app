import { describe, expect, it } from "vitest"
import { MAX_PHOTO_SIZE, resizePhoto, targetSize } from "@/photo/resize"

// RF-025: foto reduzida no aparelho para no máximo 512 × 512 px.
describe("foto", () => {
  it("calcula o tamanho mantendo a proporção", () => {
    expect(MAX_PHOTO_SIZE).toBe(512)
    expect(targetSize(2000, 1500)).toEqual({ width: 512, height: 384 })
    expect(targetSize(1000, 3000)).toEqual({ width: 171, height: 512 })
    expect(targetSize(300, 200)).toEqual({ width: 300, height: 200 })
  })

  it("reduz uma imagem de 2000 × 1500 e devolve JPEG", async () => {
    const desenhado: number[] = []
    const result = await resizePhoto(new Blob(["x"], { type: "image/png" }), {
      decode: async () => ({ width: 2000, height: 1500, close: () => {} }),
      draw: (_img, width, height, type, quality) => {
        desenhado.push(width, height)
        expect(type).toBe("image/jpeg")
        expect(quality).toBe(0.8)
        return "data:image/jpeg;base64,AAAA"
      },
    })
    expect(desenhado).toEqual([512, 384])
    expect(result).toMatch(/^data:image\/jpeg/)
  })
})
