const eurFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' })

export function formatEur(value: number): string {
  if (!Number.isFinite(value)) return '€0.00'
  return eurFormatter.format(value)
}

export function toYearly(value: number): number {
  return value * 12
}
