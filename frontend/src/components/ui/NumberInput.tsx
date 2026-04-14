import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/formatting'

interface NumberInputProps {
  value: number
  onChange: (val: number) => void
  step?: number
  min?: number
  size?: 'default' | 'compact'
}

export function NumberInput({ value, onChange, step, min, size = 'default' }: NumberInputProps) {
  const [focused, setFocused] = useState(false)

  const displayValue = useMemo(() => {
    if (value === 0) return ''
    return focused ? String(value) : formatCurrency(value)
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '')
    const num = parseFloat(raw) || 0
    if (min === undefined || num >= min) onChange(num)
  }

  const isCompact = size === 'compact'

  return (
    <div className="relative">
      <input
        type="text"
        step={step}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        data-lpignore="true"
        className={`number-input w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 ${
          isCompact ? 'px-2 py-1 pr-6 text-sm' : 'px-2.5 py-1.5 pr-7 text-sm'
        }`}
        style={{ caretColor: '#1f2937' }}
      />
      <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs ${
        isCompact ? 'right-2' : 'right-2.5'
      }`}>$</span>
    </div>
  )
}
