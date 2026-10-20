import { useState } from 'react'
import { Check, Copy, MessageSquareText } from 'lucide-react'
import { ModeBadge } from '@/components/ui/ModeBadge'
import { usePlanNarrative } from '@/hooks/usePlanNarrative'
import type { PlanNarrativeStatus } from '@/lib/narrative'

const HEADLINE_STYLES: Record<PlanNarrativeStatus, string> = {
  'on-track': 'text-emerald-700 dark:text-emerald-300',
  close: 'text-amber-700 dark:text-amber-300',
  'off-track': 'text-rose-700 dark:text-rose-300',
  'no-income': 'text-gray-700 dark:text-gray-300',
  empty: 'text-gray-700 dark:text-gray-300',
}

export function PlanNarrativeCard() {
  const { narrative, showRealValues } = usePlanNarrative()
  const [copied, setCopied] = useState(false)

  const copySummary = async () => {
    const text = [narrative.headline, ...narrative.paragraphs].join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="animate-fade-in-up card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-primary" />
          Your Plan in Words
        </h2>
        <div className="flex items-center gap-2">
          <ModeBadge showRealValues={showRealValues} />
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Copy plan summary"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <p className={`text-sm font-semibold mb-3 ${HEADLINE_STYLES[narrative.status]}`}>
        {narrative.headline}
      </p>

      <div className="space-y-2.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {narrative.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Estimates assume steady returns and constant contributions; actual markets vary.
      </p>
    </div>
  )
}
