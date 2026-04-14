import yaml from 'js-yaml'
import type { Person } from '@/types/household'
import type { PlanAssumptions, RetirementPlan } from '@/types/household'
import { validateYamlImport } from '@/lib/validation'

export type { PlanAssumptions, RetirementPlan } from '@/types/household'

export function exportToYAML(
  assumptions: PlanAssumptions,
  people: Person[]
): string {
  const plan: RetirementPlan = {
    version: '1.0',
    assumptions,
    people: people.map(p => ({
      id: p.id,
      name: p.name,
      currentAge: p.currentAge,
      retirementAge: p.retirementAge,
      annualIncome: p.annualIncome,
      annualPension: p.annualPension,
      accounts: p.accounts
    }))
  }
  return yaml.dump(plan, { indent: 2 })
}

export function importFromYAML(yamlString: string): RetirementPlan | null {
  try {
    const parsed = yaml.load(yamlString)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const result = validateYamlImport(parsed)
    if (!result.success) {
      console.error('YAML validation failed:', result.errors)
      return null
    }
    return result.data as RetirementPlan
  } catch (error) {
    console.error('Failed to parse YAML:', error)
    return null
  }
}

export function downloadYAML(content: string, filename: string = 'retirement-plan.yaml') {
  const blob = new Blob([content], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function uploadYAML(): Promise<RetirementPlan | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yaml,.yml'

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          const plan = importFromYAML(content)
          resolve(plan)
        } else {
          resolve(null)
        }
      }
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    }

    input.click()
  })
}
