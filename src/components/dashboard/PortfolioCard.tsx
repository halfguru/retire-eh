import type { Account } from '@/types/household'
import { formatMoney, formatCompactMoney } from '@/lib/formatting'
import { Wallet } from 'lucide-react'

interface PortfolioCardProps {
  totalPortfolio: number
  allAccounts: Account[]
}

const DONUT_R = 52
const DONUT_C = 2 * Math.PI * DONUT_R

export function PortfolioCard({
  totalPortfolio,
  allAccounts
}: PortfolioCardProps) {
  const rrsp = allAccounts.filter(a => a.type === 'RRSP').reduce((s, a) => s + (a.balance || 0), 0)
  const tfsa = allAccounts.filter(a => a.type === 'TFSA').reduce((s, a) => s + (a.balance || 0), 0)
  const total = totalPortfolio > 0 ? totalPortfolio : rrsp + tfsa
  const rrspFrac = total > 0 ? rrsp / total : 0
  const tfsaFrac = total > 0 ? tfsa / total : 0

  return (
    <div className="animate-fade-in-up card p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-primary" />
        Current Portfolio
      </h2>
      <div className="flex items-center justify-start">
        <div className="relative w-full max-w-[320px] h-32">
          <svg viewBox="0 0 240 120" className="w-full h-full">
            <circle cx="60" cy="60" r={DONUT_R} fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700 donut-segment" strokeWidth="14" transform="rotate(-90 60 60)" />
            {rrspFrac > 0 && (
              <circle
                cx="60"
                cy="60"
                r={DONUT_R}
                fill="none"
                stroke="#6366f1"
                strokeWidth="14"
                strokeDasharray={`${rrspFrac * DONUT_C} ${DONUT_C}`}
                strokeLinecap="round"
                className="donut-segment"
                transform="rotate(-90 60 60)"
              >
                <title>RRSP: ${formatMoney(rrsp)} ({Math.round(rrspFrac * 100)}%)</title>
              </circle>
            )}
            {tfsaFrac > 0 && (
              <circle
                cx="60"
                cy="60"
                r={DONUT_R}
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray={`${tfsaFrac * DONUT_C} ${DONUT_C}`}
                strokeDashoffset={-rrspFrac * DONUT_C}
                strokeLinecap="round"
                className="donut-segment"
                transform="rotate(-90 60 60)"
              >
                <title>TFSA: ${formatMoney(tfsa)} ({Math.round(tfsaFrac * 100)}%)</title>
              </circle>
            )}
            
            {/* Center Text */}
            <text x="60" y="58" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500 text-[10px] uppercase font-semibold tracking-wider">Total</text>
            <text x="60" y="76" textAnchor="middle" className="fill-gray-800 dark:fill-gray-100 text-[15px] font-bold">${formatCompactMoney(total)}</text>

            {/* RRSP Legend */}
            {rrsp > 0 && (
              <>
                <circle cx="136" cy="48" r="5" fill="#6366f1" />
                <text x="148" y="52" className="fill-gray-800 dark:fill-gray-100 text-[12px] font-semibold">RRSP ({Math.round(rrspFrac * 100)}%)</text>
                <text x="148" y="68" className="fill-gray-500 dark:fill-gray-400 text-[11px] font-medium">${formatMoney(rrsp)}</text>
              </>
            )}

            {/* TFSA Legend */}
            {tfsa > 0 && (
              <>
                <circle cx="136" cy="88" r="5" fill="#10b981" />
                <text x="148" y="92" className="fill-gray-800 dark:fill-gray-100 text-[12px] font-semibold">TFSA ({Math.round(tfsaFrac * 100)}%)</text>
                <text x="148" y="108" className="fill-gray-500 dark:fill-gray-400 text-[11px] font-medium">${formatMoney(tfsa)}</text>
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}
