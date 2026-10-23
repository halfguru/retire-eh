export interface PlannedGift {
  id: string
  label: string
  amount: number
  age: number
}

export interface PlanAssumptions {
  expectedReturn: number
  inflationRate: number
  replacementRate: number
  withdrawalRate: number
  showRealValues: boolean
  plannedGifts: PlannedGift[]
  // Marginal tax rate assumed while working. Used only to estimate the refund
  // from RRSP contributions; retirement tax is still calculated separately.
  workingMarginalTaxRate: number
  // When enabled, the estimated RRSP refund is reinvested in a TFSA.
  reinvestRrspRefund: boolean
}

export interface RetirementPlan {
  version: string
  assumptions: PlanAssumptions
  people: import('./person').Person[]
}
