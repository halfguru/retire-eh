import type {
  AccountBalance,
  ContributionConfig,
  HouseholdConfig,
  Assumptions,
  RetirementProjection,
  YearlyProjection,
} from '@/types/household'
import type { Account } from '@/types/person'
import type { ProjectionDataPoint } from '@/types/projection'

export interface SimpleProjection {
  year: number
  age: number
  portfolioValue: number
}

/**
 * Calculates compound future value with monthly compounding and contributions.
 */
export function calculateFutureValue(
  presentValue: number,
  monthlyContribution: number,
  monthlyReturnRate: number,
  months: number
): number {
  if (Math.abs(monthlyReturnRate) < Number.EPSILON) {
    return presentValue + monthlyContribution * months
  }
  const factor = Math.pow(1 + monthlyReturnRate, months)
  const fvOfPv = presentValue * factor
  const fvOfContributions = monthlyContribution * ((factor - 1) / monthlyReturnRate)
  return fvOfPv + fvOfContributions
}

export function calculateSafeWithdrawal(netWorth: number): number {
  return netWorth * 0.04
}

/**
 * High-level retirement projection summary.
 */
export function calculateProjection(
  householdConfig: HouseholdConfig,
  accountBalance: AccountBalance,
  contributions: ContributionConfig,
  assumptions: Assumptions,
  currentAge: number
): RetirementProjection {
  const yearsToRetirement = Math.max(0, householdConfig.retirement_age - currentAge)

  if (yearsToRetirement === 0) {
    return {
      current_age: currentAge,
      retirement_age: householdConfig.retirement_age,
      years_to_retirement: 0,
      net_worth_at_retirement:
        accountBalance.rrsp + accountBalance.tfsa + accountBalance.non_registered,
      annual_withdrawal: 0,
      pension_equivalent: 0,
    }
  }

  const monthlyReturnRate = assumptions.return_rate / 100 / 12
  const monthsToRetirement = yearsToRetirement * 12
  const monthlyContributions =
    (contributions.rrsp_annual +
      contributions.tfsa_annual +
      contributions.non_registered_annual) /
    12
  const initialBalance =
    accountBalance.rrsp + accountBalance.tfsa + accountBalance.non_registered

  const netWorthAtRetirement = calculateFutureValue(
    initialBalance,
    monthlyContributions,
    monthlyReturnRate,
    monthsToRetirement
  )

  const annualWithdrawal = calculateSafeWithdrawal(netWorthAtRetirement)

  return {
    current_age: currentAge,
    retirement_age: householdConfig.retirement_age,
    years_to_retirement: yearsToRetirement,
    net_worth_at_retirement: netWorthAtRetirement,
    annual_withdrawal: annualWithdrawal,
    pension_equivalent: annualWithdrawal,
  }
}

/**
 * Simulates portfolio compounding year-by-year across all account types (RRSP, TFSA, RESP, Non-registered)
 * with monthly compounding and monthly contributions.
 */
export function calculateYearlyProjections(
  householdConfig: HouseholdConfig,
  accountBalance: AccountBalance,
  contributions: ContributionConfig,
  assumptions: Assumptions,
  currentAge: number,
  currentYear: number
): YearlyProjection[] {
  const yearsToRetirement = Math.max(0, householdConfig.retirement_age - currentAge)
  const monthlyReturnRate = assumptions.return_rate / 100 / 12

  let rrsp = accountBalance.rrsp
  let tfsa = accountBalance.tfsa
  let resp = accountBalance.resp
  let nonRegistered = accountBalance.non_registered

  const projections: YearlyProjection[] = []

  for (let year = 0; year <= yearsToRetirement; year++) {
    projections.push({
      year: currentYear + year,
      age: currentAge + year,
      rrsp,
      tfsa,
      resp,
      non_registered: nonRegistered,
      total_net_worth: rrsp + tfsa + resp + nonRegistered,
    })

    if (year < yearsToRetirement) {
      for (let month = 0; month < 12; month++) {
        rrsp = rrsp * (1 + monthlyReturnRate) + contributions.rrsp_annual / 12
        tfsa = tfsa * (1 + monthlyReturnRate) + contributions.tfsa_annual / 12
        resp = resp * (1 + monthlyReturnRate) + contributions.resp_annual / 12
        nonRegistered =
          nonRegistered * (1 + monthlyReturnRate) + contributions.non_registered_annual / 12
      }
    }
  }

  return projections
}

/**
 * Annual compound growth without contributions.
 */
export function calculateSimpleProjection(
  totalPortfolio: number,
  currentAge: number,
  retirementAge: number,
  returnRate: number,
  currentYear: number
): SimpleProjection[] {
  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  if (yearsToRetirement === 0) return []

  const projections: SimpleProjection[] = []
  for (let year = 0; year <= yearsToRetirement; year++) {
    const age = currentAge + year
    const portfolioValue = totalPortfolio * Math.pow(1 + returnRate / 100, year)
    projections.push({
      year: currentYear + year,
      age,
      portfolioValue,
    })
  }

  return projections
}

/**
 * Projects a person's accounts to retirement and deflates to real purchasing power if requested.
 */
export function projectPersonAccounts(
  accounts: Account[],
  retirementAge: number,
  baseAge: number,
  expectedReturn: number,
  inflationRate: number,
  showRealValues: boolean,
  yearsToRetirement: number,
  currentYear: number = new Date().getFullYear()
): ProjectionDataPoint[] {
  if (yearsToRetirement <= 0) return []

  const totalRRSP = accounts
    .filter((a) => a.type === 'RRSP')
    .reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalTFSA = accounts
    .filter((a) => a.type === 'TFSA')
    .reduce((sum, acc) => sum + (acc.balance || 0), 0)
  const totalRRSPContribution = accounts
    .filter((a) => a.type === 'RRSP')
    .reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)
  const totalTFSAContribution = accounts
    .filter((a) => a.type === 'TFSA')
    .reduce((sum, acc) => sum + (acc.annualContribution || 0), 0)

  const householdConfig: HouseholdConfig = {
    retirement_age: retirementAge,
    expected_annual_income: 0,
  }
  const accountBalance: AccountBalance = {
    rrsp: totalRRSP,
    tfsa: totalTFSA,
    resp: 0,
    non_registered: 0,
  }
  const contributions: ContributionConfig = {
    rrsp_annual: totalRRSPContribution,
    tfsa_annual: totalTFSAContribution,
    resp_annual: 0,
    non_registered_annual: 0,
  }
  const assumptions: Assumptions = {
    return_rate: expectedReturn,
    inflation_rate: inflationRate,
  }

  const result = calculateYearlyProjections(
    householdConfig,
    accountBalance,
    contributions,
    assumptions,
    baseAge,
    currentYear
  )

  return result.map((p) => {
    const yearsFromNow = p.age - baseAge
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsFromNow)

    const rrspNominal = totalRRSP > 0 || totalRRSPContribution > 0 ? p.rrsp : undefined
    const tfsaNominal = totalTFSA > 0 || totalTFSAContribution > 0 ? p.tfsa : undefined

    const rrspReal = rrspNominal !== undefined ? rrspNominal / inflationFactor : undefined
    const tfsaReal = tfsaNominal !== undefined ? tfsaNominal / inflationFactor : undefined
    const totalNominal = p.total_net_worth
    const totalReal = totalNominal / inflationFactor

    return {
      year: p.year,
      age: p.age,
      RRSP: showRealValues ? rrspReal : rrspNominal,
      TFSA: showRealValues ? tfsaReal : tfsaNominal,
      Total: showRealValues ? totalReal : totalNominal,
    }
  })
}
