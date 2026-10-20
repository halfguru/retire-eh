import { useState } from 'react'

interface IntegerInputProps {
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  className?: string
  ariaLabel?: string
}

export function IntegerInput({ value, onChange, min, max, className, ariaLabel }: IntegerInputProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  const display = focused && draft !== null ? draft : String(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    setDraft(raw)
    if (raw === '') return
    const num = parseInt(raw, 10)
    if (min !== undefined && num < min) return
    if (max !== undefined && num > max) return
    onChange(num)
  }

  const handleBlur = () => {
    setFocused(false)
    if (draft === null || draft === '') {
      setDraft(null)
      return
    }
    const num = parseInt(draft, 10)
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, num))
    setDraft(null)
    if (clamped !== value) onChange(clamped)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onFocus={() => {
        setFocused(true)
        setDraft(String(value))
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label={ariaLabel}
      autoComplete="off"
      className={className}
    />
  )
}
