export function fmtCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function fmtPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function fmtAge(age: number | null): string {
  if (age === null) return 'N/A'
  return `Age ${age}`
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}
