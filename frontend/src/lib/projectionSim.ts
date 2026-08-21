// Pure-TypeScript portfolio simulations that mirror the WASM monthly-compounding
// model, so we can illustrate uncertainty (Monte Carlo), the contribution vs
// growth split, and the post-retirement drawdown phase without touching the backend.

function gaussian(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export interface MonteCarloYear {
  age: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface MonteCarloParams {
  initialBalance: number
  monthlyContribution: number
  months: number
  expectedReturnPct: number
  inflationPct: number
  startAge: number
  annualVolatility?: number
  sims?: number
  showRealValues?: boolean
}

// Runs `sims` accumulation simulations with randomly sampled monthly returns and
// returns per-age percentile bands (10/25/50/75/90). When `showRealValues` is true
// the bands are deflated to today's dollars; otherwise they stay in nominal (future) dollars.
export function runMonteCarlo(params: MonteCarloParams): MonteCarloYear[] {
  const {
    initialBalance,
    monthlyContribution,
    months,
    expectedReturnPct,
    inflationPct,
    startAge,
    annualVolatility = 0.13,
    sims = 500,
    showRealValues = true,
  } = params

  const monthlyMean = expectedReturnPct / 100 / 12
  const monthlySd = annualVolatility / Math.sqrt(12)
  const years = Math.floor(months / 12)

  const perYear: number[][] = Array.from({ length: years + 1 }, () => [])

  for (let s = 0; s < sims; s++) {
    let balance = initialBalance
    perYear[0].push(balance)
    for (let m = 1; m <= months; m++) {
      const r = monthlyMean + monthlySd * gaussian()
      balance = balance * (1 + r) + monthlyContribution
      if (balance < 0) balance = 0
      if (m % 12 === 0) perYear[m / 12].push(balance)
    }
  }

  const inflationFactor = (y: number) => Math.pow(1 + inflationPct / 100, y)

  return perYear.map((vals, y) => {
    vals.sort((a, b) => a - b)
    const deflate = (v: number) => (showRealValues ? v / inflationFactor(y) : v)
    return {
      age: startAge + y,
      p10: deflate(percentile(vals, 0.1)),
      p25: deflate(percentile(vals, 0.25)),
      p50: deflate(percentile(vals, 0.5)),
      p75: deflate(percentile(vals, 0.75)),
      p90: deflate(percentile(vals, 0.9)),
    }
  })
}

export interface DrawdownPoint {
  age: number
  balance: number
  depleted: boolean
}

export interface ContributionGrowthPoint {
  age: number
  contributions: number
  growth: number
  total: number
}

export interface ContributionGrowthParams {
  projectionData: { age: number; Total: number }[]
  annualContribution: number
}

// Splits the accumulation path into cumulative contributions vs cumulative
// investment growth, using the actual projected balances (so the split is exact).
export function buildContributionGrowth(
  params: ContributionGrowthParams
): ContributionGrowthPoint[] {
  const { projectionData, annualContribution } = params
  if (projectionData.length === 0) return []

  const result: ContributionGrowthPoint[] = []
  const initial = projectionData[0].Total
  let cumContrib = initial

  result.push({ age: projectionData[0].age, contributions: initial, growth: 0, total: initial })

  for (let i = 1; i < projectionData.length; i++) {
    cumContrib += annualContribution
    const total = projectionData[i].Total
    result.push({
      age: projectionData[i].age,
      contributions: cumContrib,
      growth: total - cumContrib,
      total,
    })
  }

  return result
}

export interface RetirementPathYear {
  age: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface RetirementPathParams {
  startBalance: number
  expectedReturnPct: number
  inflationPct: number
  withdrawalRatePct: number
  startAge: number
  endAge: number
  annualVolatility?: number
  sims?: number
}

// Simulates the retirement (decumulation) phase with randomly sampled returns and
// a constant real withdrawal (the 4% rule). Returns per-age percentile bands in
// today's dollars so the chart shows both the median and the downside drawdown.
export function simulateRetirementPaths(params: RetirementPathParams): RetirementPathYear[] {
  const {
    startBalance,
    expectedReturnPct,
    inflationPct,
    withdrawalRatePct,
    startAge,
    endAge,
    annualVolatility = 0.13,
    sims = 500,
  } = params

  const monthlyMean = expectedReturnPct / 100 / 12
  const monthlySd = annualVolatility / Math.sqrt(12)
  const monthlyWithdrawal = (startBalance * (withdrawalRatePct / 100)) / 12
  const years = endAge - startAge

  const perYear: number[][] = Array.from({ length: years + 1 }, () => [])

  for (let s = 0; s < sims; s++) {
    let balance = startBalance
    perYear[0].push(balance)
    for (let age = startAge + 1; age <= endAge; age++) {
      for (let m = 0; m < 12; m++) {
        const r = monthlyMean + monthlySd * gaussian()
        balance = balance * (1 + r) - monthlyWithdrawal
        if (balance < 0) balance = 0
      }
      perYear[age - startAge].push(balance)
    }
  }

  const inflationFactor = (y: number) => Math.pow(1 + inflationPct / 100, y)

  return perYear.map((vals, y) => {
    vals.sort((a, b) => a - b)
    const deflate = (v: number) => v / inflationFactor(y)
    return {
      age: startAge + y,
      p10: deflate(percentile(vals, 0.1)),
      p25: deflate(percentile(vals, 0.25)),
      p50: deflate(percentile(vals, 0.5)),
      p75: deflate(percentile(vals, 0.75)),
      p90: deflate(percentile(vals, 0.9)),
    }
  })
}
