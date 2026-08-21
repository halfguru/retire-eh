import { useState } from 'react'
import { TrendingUp, Coins, Landmark, Flag, Settings, BookOpen, AlertTriangle, Briefcase, Percent, type LucideIcon } from 'lucide-react'

interface LearnSection {
  title: string
  icon: LucideIcon
  color: string
  content: React.ReactNode
}

const sections: LearnSection[] = [
  {
    title: 'How Projections Work',
    icon: TrendingUp,
    color: 'text-primary',
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
    title: 'Nominal vs Real Returns',
    icon: Percent,
    color: 'text-primary',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          The return you enter on the Plan tab — <strong className="text-gray-800 dark:text-gray-200">7% by default</strong> — is a <strong className="text-gray-800 dark:text-gray-200">nominal</strong> return. That's the raw growth number, <em>before</em> inflation is taken into account.
        </p>
        <p>
          A <strong className="text-gray-800 dark:text-gray-200">real</strong> return is what your money actually buys after inflation. Convert between them with:{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">real ≈ (1 + nominal) ÷ (1 + inflation) − 1</code>
        </p>
        <p>
          <strong className="text-gray-800 dark:text-gray-200">Example:</strong> $100 earning 7% nominal becomes $107. But with 2.5% inflation it only buys about $104.40 of last year's goods — so the <em>real</em> gain is ~4.4%.
        </p>
        <p>
          This calculator keeps the two separate: the projection compounds at the <em>nominal</em> rate, and the <strong className="text-gray-800 dark:text-gray-200">"Show real values"</strong> toggle deflates the result into <em>today's dollars</em> so you see true purchasing power.
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="inline w-4 h-4 text-warning" />
          Always compare like with like: a 7% nominal return and a ~4.4% real return describe the same outcome — just measured differently.
        </p>
      </div>
    )
  },
  {
    title: 'Safe Withdrawal Rate (4% Rule)',
    icon: Coins,
    color: 'text-amber-500',
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
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="inline w-4 h-4 text-warning" />
          This is a guideline, not a guarantee. Actual needs may vary based on market performance and spending.
        </p>
        <p>
          If you plan one-time gifts (e.g., helping kids with a down payment), enter them under <strong className="text-gray-800 dark:text-gray-200">Planned Gifts</strong> in the Plan tab. They're reserved from your retirement portfolio, so your sustainable withdrawal is based on what remains after setting that money aside.
        </p>
      </div>
    )
  },
  {
    title: 'RRSP vs TFSA',
    icon: Landmark,
    color: 'text-secondary',
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
        <p className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
          <strong className="text-gray-800 dark:text-gray-200 block mb-1">Pre-Tax vs. After-Tax Projections:</strong>
          Because RRSP withdrawals are taxed as regular income, a dollar in an RRSP does not have the same purchasing power as a dollar in a TFSA. This app applies your estimated <strong>Retirement Tax Rate</strong> directly to your projected RRSP balance to compute your <strong>After-Tax Net Worth</strong> and target progress. This ensures you know exactly how much additional savings you need to cover both your base goals and your expected tax liabilities.
        </p>
      </div>
    )
  },
  {
    title: 'CPP & OAS',
    icon: Flag,
    color: 'text-error',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Canadian government benefits provide a foundation for retirement income:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <strong className="text-blue-700 dark:text-blue-300">CPP (Canada Pension Plan)</strong>
            <p className="mt-1 text-xs space-y-2">
              <span className="block">
                A <strong>contribution-based</strong> benefit (not need-based). What you receive depends on how much you contributed over your career, not on your current savings.
              </span>
              <span className="block">
                Your pension is calculated from your <strong>best 83% of working years</strong> (the 17% lowest/zero-earning years are dropped). Each year only counts up to the <strong>Year's Maximum Pensionable Earnings (YMPE)</strong> — earning above it doesn't increase CPP.
              </span>
              <span className="block">
                <strong>Maximum ~$1,508/month at age 65</strong> (2026). To reach the maximum you generally need ~39 years of maximum contributions.
              </span>
              <span className="block">
                You can take it from age <strong>60 to 70</strong>. Each month before 65 reduces the amount by ~0.6% (about 7.2%/year); each month after 65 increases it by ~0.7% until 70.
              </span>
              <span className="block">
                Your <strong>official estimate</strong> lives in your My Service Canada Account under "CPP Statement of Contributions."
              </span>
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <strong className="text-amber-700 dark:text-amber-300">OAS (Old Age Security)</strong>
            <p className="mt-1 text-xs">
              Available at 65, based on residency (40 years in Canada for the full amount). Maximum ~$752/month in 2026. Clawed back at high income (starting ~$95k).
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
    title: 'Workplace Pensions',
    icon: Briefcase,
    color: 'text-sky-500',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Many Canadian employers — especially governments and large organizations — offer a <strong className="text-gray-800 dark:text-gray-200">Defined Benefit (DB) pension</strong>. Unlike your savings, a DB pension pays a guaranteed, inflation-indexed income for life, calculated from your salary and years of service.
        </p>
        <p>
          The core formula is:{' '}
          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            Annual pension = accrual rate × best-average salary × years of service
          </code>
        </p>
        <p>
          <strong className="text-gray-800 dark:text-gray-200">Example — federal public servant:</strong> Someone who starts at ~23, retires at 58 with ~35 years of service, and peaks around $100k salary:
        </p>
        <ul className="space-y-1 text-xs">
          <li>• Accrual rate: 2% (post-2013 federal rate)</li>
          <li>• Best-5 average salary: ~$100,000</li>
          <li>• Years of service: ~35</li>
          <li>
            • <strong className="text-gray-800 dark:text-gray-200">≈ 2% × $100,000 × 35 = $70,000/year</strong>
          </li>
        </ul>
        <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-lg">
          <strong className="text-sky-700 dark:text-sky-300">In this app</strong>
          <p className="mt-1 text-xs">
            Enter this as <strong>Annual Employer Pension (at retirement)</strong> on the Plan tab. It's added to CPP and OAS as guaranteed income starting at your retirement age. Leave at 0 if you have no workplace pension — for example, a DC plan or RRSP is already captured in your investment accounts.
          </p>
        </div>
        <p className="text-xs text-gray-500">
          * Federal employees also receive a temporary "bridge benefit" from retirement to 65 roughly equal to CPP. Since this app counts CPP separately, don't add the bridge amount.
        </p>
      </div>
    )
  },
  {
    title: 'Assumptions & Defaults',
    icon: Settings,
    color: 'text-violet-500',
    content: (
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          This calculator uses conservative assumptions by default:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-indigo-500">•</span>
            <span><strong className="text-gray-800 dark:text-gray-200">7% expected return (nominal):</strong> Raw annual return before inflation. After 2.5% inflation, the real return is about 4.4%.</span>
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
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="inline w-4 h-4 text-warning" />
          These are assumptions. Actual returns and inflation will vary. Consider consulting a financial advisor for personalized advice.
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
           <section.icon className={`w-5 h-5 ${section.color}`} />
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
      <div className="animate-fade-in-up card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Learn About Retirement Planning
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Understanding the concepts behind your retirement projection
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div key={section.title} className="animate-fade-in-up" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
            <AccordionItem
              section={section}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          </div>
        ))}
      </div>

      <div className="animate-fade-in-up-delay-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          Disclaimer
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          This calculator provides estimates for educational purposes only. It is not financial advice. 
          Actual results will vary based on market conditions, tax changes, and personal circumstances. 
          Consider consulting a qualified financial advisor for personalized retirement planning.
        </p>
      </div>
    </div>
  )
}
