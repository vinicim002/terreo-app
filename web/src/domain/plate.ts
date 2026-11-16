// Placas de carro (research R6): antiga ABC1234 e Mercosul ABC1D23, guardadas em maiúsculas sem hífen.
const OLD = /^[A-Z]{3}\d{4}$/
const MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/

export function normalizePlate(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function isValidPlate(plate: string): boolean {
  return OLD.test(plate) || MERCOSUL.test(plate)
}

export function formatPlate(plate: string): string {
  return OLD.test(plate) ? `${plate.slice(0, 3)}-${plate.slice(3)}` : plate
}
