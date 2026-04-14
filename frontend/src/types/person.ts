export interface Account {
  id: string
  type: 'RRSP' | 'TFSA'
  balance: number
  annualContribution: number
}

export interface Person {
  id: string
  name: string
  currentAge: number
  retirementAge: number
  annualIncome: number
  annualPension: number
  accounts: Account[]
}
