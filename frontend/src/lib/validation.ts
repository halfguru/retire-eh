import { z } from 'zod'

const accountSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['RRSP', 'TFSA']),
  balance: z.number().min(0),
  annualContribution: z.number().min(0),
})

const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  currentAge: z.number().int().min(0).max(120),
  retirementAge: z.number().int().min(0).max(120),
  annualIncome: z.number().min(0),
  annualPension: z.number().min(0),
  accounts: z.array(accountSchema),
})

const assumptionsSchema = z.object({
  expectedReturn: z.number().min(0).max(50),
  inflationRate: z.number().min(0).max(30),
  replacementRate: z.number().min(0).max(200),
  withdrawalRate: z.number().min(0.01).max(20),
  showRealValues: z.boolean(),
})

export const retirementPlanSchema = z.object({
  version: z.string(),
  assumptions: assumptionsSchema,
  people: z.array(personSchema).min(1),
})

export function validateYamlImport(data: unknown): { success: true; data: z.infer<typeof retirementPlanSchema> } | { success: false; errors: string[] } {
  const result = retirementPlanSchema.safeParse(data)
  if (result.success) {
    const people = result.data.people
    for (const person of people) {
      if (person.retirementAge <= person.currentAge) {
        return {
          success: false,
          errors: [`Person "${person.name}": retirement age (${person.retirementAge}) must be greater than current age (${person.currentAge})`],
        }
      }
    }
    return { success: true, data: result.data }
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
  return { success: false, errors }
}

export function validateAge(currentAge: number): string | null {
  if (isNaN(currentAge) || currentAge < 0) return 'Age must be 0 or greater'
  if (currentAge > 120) return 'Age must be 120 or less'
  if (!Number.isInteger(currentAge)) return 'Age must be a whole number'
  return null
}

export function validateRetirementAge(retirementAge: number, currentAge: number): string | null {
  if (isNaN(retirementAge) || retirementAge < 0) return 'Age must be 0 or greater'
  if (retirementAge > 120) return 'Age must be 120 or less'
  if (!Number.isInteger(retirementAge)) return 'Age must be a whole number'
  if (retirementAge <= currentAge) return 'Must be greater than current age'
  return null
}
