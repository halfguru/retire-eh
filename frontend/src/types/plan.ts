export interface PlanAssumptions {
  expectedReturn: number
  inflationRate: number
  replacementRate: number
  withdrawalRate: number
  showRealValues: boolean
}

export interface RetirementPlan {
  version: string
  assumptions: PlanAssumptions
  people: import('./person').Person[]
}
