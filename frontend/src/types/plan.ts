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
  retirementTaxRate: number
  showRealValues: boolean
  plannedGifts: PlannedGift[]
}

export interface RetirementPlan {
  version: string
  assumptions: PlanAssumptions
  people: import('./person').Person[]
}
