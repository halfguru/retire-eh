export type { Account, Person } from './person'
export type { ProjectionDataPoint } from './projection'
export type { PlanAssumptions, RetirementPlan } from './plan'

export interface HouseholdConfig {
  retirement_age: number
  expected_annual_income: number
}

export interface AccountBalance {
  rrsp: number
  tfsa: number
  resp: number
  non_registered: number
}

export interface ContributionConfig {
  rrsp_annual: number
  tfsa_annual: number
  resp_annual: number
  non_registered_annual: number
}

export interface ChildInfo {
  age: number
  target_contribution: number
}

export interface Assumptions {
  return_rate: number
  inflation_rate: number
}

export interface RetirementProjection {
  current_age: number
  retirement_age: number
  years_to_retirement: number
  net_worth_at_retirement: number
  annual_withdrawal: number
  pension_equivalent: number
}

export interface YearlyProjection {
  year: number
  age: number
  rrsp: number
  tfsa: number
  resp: number
  non_registered: number
  total_net_worth: number
}
