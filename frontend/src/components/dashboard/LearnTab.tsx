import { useState } from 'react'

interface LearnSection {
  title: string
  icon: string
  content: React.ReactNode
}

const sections: LearnSection[] = [
  {
    title: 'How Projections Work',
    icon: '📈',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Projections use <strong className="text-gray-800 dark:text-gray-200">compound growth</strong> to estimate your portfolio's future value. Each year, your portfolio grows by the expected return rate, and you add contributions.
        </p>
        <p>
          The formula: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Future Value = Present × (1 + rate)^years + contributions</code>
        </p>
        <p>
          We also account for <strong className="text-gray-800 dark:text-gray-200">inflation</strong>. "Today's dollars" shows what your money can buy in today's terms, making it easier to understand.
        </p>
      </div>
    )
  },
  {
    title: 'Safe Withdrawal Rate (4% Rule)',
    icon: '💸',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          The <strong className="text-gray-800 dark:text-gray-200">4% rule</strong> is a guideline for sustainable retirement withdrawals. It suggests you can withdraw 4% of your portfolio in the first year, then adjust for inflation each year.
        </p>
        <p>
          Historically, this approach has sustained portfolios for 30+ years across various market conditions.
        </p>
        <p>
          <strong className="text-gray-800 dark:text-gray-200">Example:</strong> A $1,000,000 portfolio would provide $40,000/year in the first year.
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ This is a guideline, not a guarantee. Actual needs may vary based on market performance and spending.
        </p>
      </div>
    )
  },
  {
    title: 'RRSP vs TFSA',
    icon: '🏦',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Both accounts offer tax advantages, but in different ways:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <strong className="text-indigo-700 dark:text-indigo-300">RRSP</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Tax deduction on contributions</li>
              <li>• Tax-deferred growth</li>
              <li>• Taxed on withdrawal</li>
              <li>• Best in high-income years</li>
            </ul>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <strong className="text-emerald-700 dark:text-emerald-300">TFSA</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• No tax deduction</li>
              <li>• Tax-free growth</li>
              <li>• Tax-free withdrawal</li>
              <li>• Best in lower-income years</li>
            </ul>
          </div>
        </div>
        <p>
          <strong className="text-gray-800 dark:text-gray-200">Strategy:</strong> Prioritize RRSP when your marginal tax rate is high, TFSA when it's lower.
        </p>
      </div>
    )
  },
  {
    title: 'CPP & OAS',
    icon: '🇨🇦',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Canadian government benefits provide a foundation for retirement income:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <strong className="text-blue-700 dark:text-blue-300">CPP (Canada Pension Plan)</strong>
            <p className="mt-1 text-xs">
              Based on your contributions during working years. Can start as early as 60 or delay to 70 for higher payments. Maximum ~$1,364/month in 2024.
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <strong className="text-amber-700 dark:text-amber-300">OAS (Old Age Security)</strong>
            <p className="mt-1 text-xs">
              Available at 65, based on residency. Maximum ~$691/month in 2024. Clawed back at high income (starting ~$90k).
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          * Amounts are estimates and subject to change. Visit canada.ca for current rates.
        </p>
      </div>
    )
  },
  {
    title: 'Assumptions & Defaults',
    icon: '⚙️',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          This calculator uses conservative assumptions by default:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-indigo-500">•</span>
            <span><strong className="text-gray-800 dark:text-gray-200">7% expected return:</strong> Balanced portfolio assumption. Adjust based on your risk tolerance.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500">•</span>
            <span><strong className="text-gray-800 dark:text-gray-200">2.5% inflation:</strong> Bank of Canada target is 2%, but we use slightly higher for safety.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500">•</span>
            <span><strong className="text-gray-800 dark:text-gray-200">70% replacement rate:</strong> Common guideline for retirement income needs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500">•</span>
            <span><strong className="text-gray-800 dark:text-gray-200">4% withdrawal rate:</strong> Safe withdrawal rate for 30-year retirement.</span>
          </li>
        </ul>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ These are assumptions. Actual returns and inflation will vary. Consider consulting a financial advisor for personalized advice.
        </p>
      </div>
    )
  }
]

function AccordionItem({ section, isOpen, onToggle }: { section: LearnSection; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{section.icon}</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{section.title}</span>
        </div>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {section.content}
        </div>
      )}
    </div>
  )
}

export function LearnTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-6">
      <div style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
          📚 Learn About Retirement Planning
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Understanding the concepts behind your retirement projection
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div key={section.title} style={{ animation: `fadeInUp 0.5s ease-out ${0.1 + index * 0.05}s forwards`, opacity: 0 }}>
            <AccordionItem
              section={section}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          </div>
        ))}
      </div>

      <div style={{ animation: 'fadeInUp 0.5s ease-out 0.35s forwards', opacity: 0 }} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Disclaimer</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          This calculator provides estimates for educational purposes only. It is not financial advice. 
          Actual results will vary based on market conditions, tax changes, and personal circumstances. 
          Consider consulting a qualified financial advisor for personalized retirement planning.
        </p>
      </div>
    </div>
  )
}
