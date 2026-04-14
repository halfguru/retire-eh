export function formatMoney(value: number): string {
  return value.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatCompactMoney(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`
  }
  return `$${value.toFixed(0)}`
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) || 0 : value
  return num.toLocaleString('en-CA')
}
