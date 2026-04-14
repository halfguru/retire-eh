# Architecture Research: Retire, Eh? — Refactoring Monolithic State

**Domain:** React 19 + Rust/WASM SPA — codebase quality remediation
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

The current architecture places all state in `App.tsx` (271 lines) with prop drilling through 3+ layers and 10–20 props per intermediate component. This research identifies the target architecture: decompose `App.tsx` into three React Context providers (`PeopleContext`, `AssumptionsContext`, `ProjectionContext`), extract duplicated logic into shared hooks and utilities, centralize types, and replace inline animation styles with Tailwind v4 CSS utilities. The architecture is designed for incremental migration — each context provider can be introduced independently without breaking the rest of the app.

The recommended approach uses React 19's native `<Context value={}>` provider syntax (no `<Context.Provider>`) combined with `useReducer` for the people/accounts domain (the most complex state), and simple `useState`+Context for assumptions and UI state. This avoids external dependencies while eliminating prop drilling entirely.

---

## Target Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ PlanTab  │ │OverviewTab│ │ProjTab   │ │IncomeTab │ │LearnTab│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │             │            │             │            │       │
│  ┌────┴─────────────┴────────────┴─────────────┴────────────┘      │
│  │              Shared UI Components                                │
│  │  NumberInput · InfoTooltip · ViewSelector · ErrorBoundary       │
├──────────────────────────────────────────────────────────────────────┤
│                        Context Layer                                │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────────┐  │
│  │ PeopleContext    │ │ AssumptionsCtx   │ │ ProjectionContext   │  │
│  │ (useReducer)    │ │ (useState)       │ │ (derived + WASM)    │  │
│  └────────┬────────┘ └────────┬─────────┘ └──────────┬──────────┘  │
│           │                    │                       │             │
├───────────┴────────────────────┴───────────────────────┴─────────────┤
│                        Hooks & Utilities Layer                      │
│  ┌──────────────────┐ ┌──────────────┐ ┌────────────────────────┐   │
│  │ useRetirementGoal│ │ useProjection│ │ formatCurrency · ids   │   │
│  │ (derived state)  │ │ (WASM init)  │ │ updateHelpers · validate│   │
│  └──────────────────┘ └──────┬───────┘ └────────────────────────┘   │
├───────────────────────────────┴──────────────────────────────────────┤
│                        WASM Computation Layer                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ wasm-loader.ts → RetirementCalculator (Rust/WASM singleton)  │   │
│  └──────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│                        Persistence Layer                            │
│  ┌──────────────────┐ ┌──────────────────────────────────────────┐ │
│  │ usePersistence   │ │ yaml-utils.ts (export/import/download)   │ │
│  │ (localStorage)   │ │                                          │ │
│  └──────────────────┘ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| `PeopleContext` | People/accounts CRUD, selected person, household aggregation | `useReducer` with typed actions, exports `usePeople()` + `usePeopleDispatch()` hooks |
| `AssumptionsContext` | Return rate, inflation, replacement rate, withdrawal rate, real values toggle | `useState` per value + single provider, exports `useAssumptions()` + `useAssumptionsUpdater()` |
| `ProjectionContext` | Projection data (combined, individual, real), WASM loading state | Derived from People + Assumptions contexts via `useMemo`, exports `useProjection()` hook |
| `useRetirementGoal` | Goal calculations (required income, progress, gap, additional savings) | Pure hook consuming contexts, replaces duplicated logic in SummaryCard + GoalsCard |
| `usePersistence` | localStorage read/write, YAML import/export orchestration | Consumes all contexts, writes on state change via `useEffect` |
| `NumberInput` | Shared formatted number input with blur/focus switching | Single component replacing two copies in PersonForm + AccountCard |
| `ErrorBoundary` | Catches render crashes per tab and app shell | Class component wrapping tab content |

---

## Recommended Project Structure

```
frontend/src/
├── main.tsx                    # React bootstrap + provider tree
├── App.tsx                     # Layout shell (Header, Tabs, main, Footer) — ~60 lines
├── App.css                     # @keyframes fadeInUp (kept, moved to index.css)
├── index.css                   # Tailwind imports, theme, animations, global styles
│
├── types/                      # All domain types — single source of truth
│   ├── index.ts                # Re-exports everything
│   ├── person.ts               # Person, Account, AccountType
│   ├── assumptions.ts          # Assumptions, PlanAssumptions
│   ├── projection.ts           # ProjectionDataPoint
│   ├── wasm.ts                 # HouseholdConfig, AccountBalance, etc. (WASM-facing)
│   └── yaml.ts                 # RetirementPlan, PersonData (import/export shapes)
│
├── context/                    # React Context providers
│   ├── PeopleContext.tsx        # PeopleProvider, usePeople, usePeopleDispatch
│   ├── PeopleReducer.ts        # reducer function, action types, update helpers
│   ├── AssumptionsContext.tsx   # AssumptionsProvider, useAssumptions, useAssumptionsUpdater
│   ├── ProjectionContext.tsx    # ProjectionProvider, useProjectionData
│   └── AppProviders.tsx        # Composes all providers into single wrapper
│
├── hooks/                      # Shared custom hooks
│   ├── useDarkMode.ts          # Dark mode toggle (existing, unchanged)
│   ├── useRetirementGoal.ts    # Goal progress calculations (extracted from cards)
│   ├── useWasm.ts              # WASM init + loading state (extracted from useProjection)
│   └── useLocalStorage.ts      # Generic localStorage hook (adopted or removed)
│
├── components/                 # Shared UI components
│   ├── Header.tsx              # App header (existing)
│   ├── Footer.tsx              # App footer (existing)
│   ├── Tabs.tsx                # Tab navigation (existing)
│   ├── NumberInput.tsx         # Shared formatted number input (extracted)
│   ├── InfoTooltip.tsx         # Tooltip component (moved from dashboard/)
│   ├── ViewSelector.tsx        # Household/individual toggle (moved from dashboard/)
│   └── ErrorBoundary.tsx       # Error boundary wrapper (new)
│
├── components/dashboard/       # Tab-specific content components
│   ├── PlanTab.tsx             # Plan input tab (simplified — no prop drilling)
│   ├── OverviewTab.tsx         # Overview dashboard (simplified)
│   ├── ProjectionsTab.tsx      # Projections chart tab
│   ├── IncomeTab.tsx           # Income breakdown tab
│   ├── LearnTab.tsx            # Educational content tab (static)
│   ├── PersonSelector.tsx      # Multi-person tab switcher
│   ├── PersonForm.tsx          # Person editing form (uses NumberInput component)
│   ├── AccountCard.tsx         # Account row (uses NumberInput component)
│   ├── AssumptionsPanel.tsx    # Assumptions editing form
│   ├── SummaryCard.tsx         # On-track status card (uses useRetirementGoal)
│   ├── PortfolioCard.tsx       # Current portfolio display
│   ├── RetirementProjectionCard.tsx  # Projected portfolio display
│   ├── GoalsCard.tsx           # Goal progress bar (uses useRetirementGoal)
│   ├── GrowthChart.tsx         # Recharts LineChart (lazy-loaded)
│   └── IncomeBreakdownCard.tsx # Retirement income sources
│
└── lib/                        # Non-React utilities
    ├── format.ts               # formatCurrency, formatCompactCurrency, formatMoney
    ├── ids.ts                  # generateId (crypto.randomUUID wrapper)
    ├── validate.ts             # YAML import validation, numeric range checks
    ├── wasm-loader.ts          # WASM async init singleton (existing)
    ├── yaml-utils.ts           # YAML serialization (simplified, uses types/)
    ├── retirement_core.js      # WASM JS bindings (generated)
    ├── retirement_core.d.ts    # WASM type declarations (generated)
    └── retirement_core_bg.wasm.d.ts  # WASM binary types (generated)
```

### Structure Rationale

- **`types/`** — Single source of truth for all domain shapes. Currently `Person` is in `hooks/`, `Account` is in `hooks/`, WASM types are in `types/`, YAML types are in `lib/`. Consolidating here means adding a field touches one file.
- **`context/`** — Each domain gets its own file. `PeopleReducer.ts` is split out because the reducer + action types + helper functions are substantial (~80 lines). `AppProviders.tsx` composes providers so `main.tsx` stays clean.
- **`hooks/`** — Only cross-cutting hooks that consume contexts. Domain-specific hooks (like `usePeople`) live in `context/` and are exported from there.
- **`components/`** (root) — Shared/reusable components. If two tabs use it, it goes here. Tab-specific cards stay in `dashboard/`.
- **`lib/`** — Pure functions with no React dependency. `formatCurrency`, `generateId`, validation — all testable in isolation.

---

## Architectural Patterns

### Pattern 1: Split Context + useReducer for Complex State

**What:** Use `useReducer` with a typed action union for the people/accounts domain, exposed via two separate Contexts (state + dispatch) to prevent unnecessary re-renders. Components that only read data don't re-render when only dispatch changes.

**When to use:** When state has 7+ update operations with identical `.map()` patterns (current `usePeopleManagement`).

**Trade-offs:**
- Pro: Eliminates all prop drilling for people/accounts. Components call `usePeopleDispatch()` directly.
- Pro: Action types serve as documentation. Every state transition is named and typed.
- Pro: Separate state/dispatch contexts prevent re-renders in dispatch-only consumers.
- Con: Slightly more boilerplate than `useState` (reducer function + action types).
- Con: Mild learning curve for contributors unfamiliar with reducers.

**Example:**

```typescript
// context/PeopleContext.tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Person, Account } from '@/types'

// --- State Context (data consumers) ---
interface PeopleState {
  people: Person[]
  selectedPersonId: string | null
}

const PeopleStateContext = createContext<PeopleState | null>(null)

// --- Dispatch Context (action dispatchers) ---
type PeopleAction =
  | { type: 'ADD_PERSON' }
  | { type: 'DELETE_PERSON'; id: string }
  | { type: 'UPDATE_PERSON'; id: string; field: keyof Person; value: string | number }
  | { type: 'ADD_ACCOUNT'; personId: string; accountType: 'RRSP' | 'TFSA' }
  | { type: 'DELETE_ACCOUNT'; personId: string; accountId: string }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; personId: string; accountId: string; balance: number }
  | { type: 'UPDATE_ACCOUNT_CONTRIBUTION'; personId: string; accountId: string; contribution: number }
  | { type: 'SET_PEOPLE'; people: Person[] }
  | { type: 'SELECT_PERSON'; id: string | null }
  | { type: 'IMPORT_PLAN'; people: Person[] }

const PeopleDispatchContext = createContext<React.Dispatch<PeopleAction> | null>(null)

// --- Provider ---
export function PeopleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(peopleReducer, initialState)
  return (
    <PeopleStateContext value={state}>
      <PeopleDispatchContext value={dispatch}>
        {children}
      </PeopleDispatchContext>
    </PeopleStateContext>
  )
}

// --- Consumer hooks ---
export function usePeople(): PeopleState {
  const ctx = useContext(PeopleStateContext)
  if (!ctx) throw new Error('usePeople must be used within PeopleProvider')
  return ctx
}

export function usePeopleDispatch(): React.Dispatch<PeopleAction> {
  const ctx = useContext(PeopleDispatchContext)
  if (!ctx) throw new Error('usePeopleDispatch must be used within PeopleProvider')
  return ctx
}
```

### Pattern 2: Derived Context for Computed State

**What:** A `ProjectionContext` that consumes `PeopleContext` and `AssumptionsContext` to compute projection data. It doesn't own state — it derives everything from other contexts via `useMemo`.

**When to use:** When one domain of data is entirely computed from others (projection data is a pure function of people + assumptions + WASM).

**Trade-offs:**
- Pro: Single source of truth — projection data can never be out of sync with inputs.
- Pro: Components just call `useProjectionData()` — no props needed.
- Con: Tight coupling to two other contexts (inherent in the domain, not avoidable).
- Con: Must be careful with `useMemo` dependency arrays.

**Example:**

```typescript
// context/ProjectionContext.tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePeople } from './PeopleContext'
import { useAssumptions } from './AssumptionsContext'
import { useWasm } from '@/hooks/useWasm'
import type { ProjectionDataPoint } from '@/types'

interface ProjectionState {
  projectionData: ProjectionDataPoint[]
  individualProjectionData: ProjectionDataPoint[]
  realProjectionData: ProjectionDataPoint[]
  wasmLoaded: boolean
  // Household aggregates
  totalPortfolio: number
  totalAnnualContributions: number
  totalAnnualIncome: number
  totalAnnualPension: number
  yearsToRetirement: number
  householdRetirementAge: number
}

const ProjectionContext = createContext<ProjectionState | null>(null)

export function ProjectionProvider({ children }: { children: ReactNode }) {
  const { people } = usePeople()
  const assumptions = useAssumptions()
  const { wasmLoaded, calculateProjection } = useWasm()

  // All derived computation lives here — no duplicate calculations in App.tsx
  const derived = useMemo(() => {
    // ... aggregate accounts, call WASM, return structured result
  }, [people, assumptions, wasmLoaded, calculateProjection])

  return <ProjectionContext value={derived}>{children}</ProjectionContext>
}

export function useProjectionData(): ProjectionState {
  const ctx = useContext(ProjectionContext)
  if (!ctx) throw new Error('useProjectionData must be used within ProjectionProvider')
  return ctx
}
```

### Pattern 3: Shared Hook for Duplicated Logic

**What:** Extract the identical goal calculation from `SummaryCard` and `GoalsCard` into `useRetirementGoal` hook.

**When to use:** When two or more components compute the exact same derived values from the same inputs.

**Trade-offs:**
- Pro: Single implementation to test and maintain.
- Pro: Components become pure render functions.
- Con: None significant — this is a clear win.

**Example:**

```typescript
// hooks/useRetirementGoal.ts
import { useMemo } from 'react'
import { useProjectionData } from '@/context/ProjectionContext'
import { useAssumptions } from '@/context/AssumptionsContext'
import { getCalculator } from '@/lib/wasm-loader'

export interface RetirementGoalResult {
  portfolioAtRetirement: number
  requiredAnnualIncome: number
  requiredAnnualIncomeAfterPension: number
  requiredPortfolio: number
  progress: number
  gap: number
  additionalAnnualSavings: number
  isOnTrack: boolean
  projectedAnnualIncome: number
}

export function useRetirementGoal(): RetirementGoalResult {
  const { realProjectionData, totalAnnualIncome, totalAnnualPension, totalPortfolio, yearsToRetirement, currentAnnualContributions } = useProjectionData()
  const { replacementRate, withdrawalRate, expectedReturn, inflationRate } = useAssumptions()

  return useMemo(() => {
    const portfolioAtRetirement = realProjectionData.length > 0
      ? realProjectionData[realProjectionData.length - 1].Total : 0

    const requiredAnnualIncome = totalAnnualIncome * (replacementRate / 100)
    const requiredAnnualIncomeAfterPension = Math.max(0, requiredAnnualIncome - totalAnnualPension)
    const requiredPortfolio = withdrawalRate > 0
      ? requiredAnnualIncomeAfterPension / (withdrawalRate / 100) : 0
    const progress = requiredPortfolio > 0
      ? Math.min(100, (portfolioAtRetirement / requiredPortfolio) * 100) : 0
    const gap = requiredPortfolio - portfolioAtRetirement
    const isOnTrack = progress >= 100
    const projectedAnnualIncome = (portfolioAtRetirement * (withdrawalRate / 100)) + totalAnnualPension

    // WASM call with JS fallback (was duplicated in SummaryCard + GoalsCard)
    let additionalAnnualSavings = 0
    if (yearsToRetirement > 0) {
      const initialPortfolio = realProjectionData.length > 0
        ? realProjectionData[0].Total : totalPortfolio
      try {
        const calculator = getCalculator()
        additionalAnnualSavings = calculator.calculate_additional_annual_savings(
          initialPortfolio, requiredPortfolio, yearsToRetirement,
          expectedReturn, inflationRate, currentAnnualContributions
        )
      } catch {
        // JS fallback calculation
        const monthlyNominalRate = expectedReturn / 100 / 12
        const monthlyInflationRate = inflationRate / 100 / 12
        const months = yearsToRetirement * 12
        const monthlyRealRate = monthlyNominalRate - monthlyInflationRate
        if (monthlyRealRate <= 0) { additionalAnnualSavings = gap / yearsToRetirement }
        else {
          additionalAnnualSavings = (gap * monthlyRealRate /
            ((1 + monthlyRealRate) ** months - 1)) * 12
        }
      }
    }

    return {
      portfolioAtRetirement, requiredAnnualIncome, requiredAnnualIncomeAfterPension,
      requiredPortfolio, progress, gap, additionalAnnualSavings, isOnTrack, projectedAnnualIncome
    }
  }, [realProjectionData, totalAnnualIncome, totalAnnualPension, totalPortfolio,
      yearsToRetirement, currentAnnualContributions, replacementRate, withdrawalRate,
      expectedReturn, inflationRate])
}
```

### Pattern 4: State Update Helper Functions

**What:** Extract the repetitive `people.map(p => p.id === id ? { ...p, ... } : p)` pattern into pure helper functions in the reducer file.

**When to use:** When the same immutable update pattern appears 7+ times.

**Example:**

```typescript
// context/PeopleReducer.ts
import type { Person, Account } from '@/types'
import { generateId } from '@/lib/ids'

// Pure helpers — testable in isolation
function updatePersonById(people: Person[], id: string, updater: (p: Person) => Person): Person[] {
  return people.map(p => p.id === id ? updater(p) : p)
}

function updateAccountInPerson(person: Person, accountId: string, updater: (a: Account) => Account): Person {
  return {
    ...person,
    accounts: person.accounts.map(a => a.id === accountId ? updater(a) : a)
  }
}

type PeopleAction =
  | { type: 'ADD_PERSON' }
  | { type: 'DELETE_PERSON'; id: string }
  | { type: 'UPDATE_PERSON'; id: string; field: keyof Person; value: string | number }
  | { type: 'ADD_ACCOUNT'; personId: string; accountType: 'RRSP' | 'TFSA' }
  | { type: 'DELETE_ACCOUNT'; personId: string; accountId: string }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; personId: string; accountId: string; balance: number }
  | { type: 'UPDATE_ACCOUNT_CONTRIBUTION'; personId: string; accountId: string; contribution: number }
  | { type: 'SET_PEOPLE'; people: Person[] }
  | { type: 'SELECT_PERSON'; id: string | null }
  | { type: 'IMPORT_PLAN'; people: Person[] }

export function peopleReducer(state: PeopleState, action: PeopleAction): PeopleState {
  switch (action.type) {
    case 'ADD_PERSON': {
      const newId = generateId()
      const newPerson: Person = {
        id: newId, name: `Person ${state.people.length + 1}`,
        currentAge: 35, retirementAge: 65, annualIncome: 0, annualPension: 0, accounts: []
      }
      return { ...state, people: [...state.people, newPerson], selectedPersonId: newId }
    }
    case 'UPDATE_PERSON':
      return {
        ...state,
        people: updatePersonById(state.people, action.id, p => ({ ...p, [action.field]: action.value }))
      }
    case 'UPDATE_ACCOUNT_BALANCE':
      return {
        ...state,
        people: updatePersonById(state.people, action.personId,
          p => updateAccountInPerson(p, action.accountId, a => ({ ...a, balance: action.balance }))
        )
      }
    case 'IMPORT_PLAN':
      return {
        ...state,
        people: action.people,
        selectedPersonId: action.people[0]?.id ?? null
      }
    // ... remaining cases use same helpers
    default:
      return state
  }
}
```

### Pattern 5: Tailwind v4 Animation Utilities

**What:** Replace 9 inline `style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}` with a single Tailwind utility class defined via `@theme` in `index.css`.

**When to use:** When the same animation is applied across many components.

**Trade-offs:**
- Pro: Single definition, respects `prefers-reduced-motion`, consistent timing.
- Pro: Components use `className="animate-fade-in-up"` instead of inline styles.
- Con: Requires moving `@keyframes fadeInUp` from `App.css` to `index.css` `@theme` block.

**Example:**

```css
/* index.css — inside existing @theme block, add: */
@theme {
  /* ... existing theme vars ... */

  --animate-fade-in-up: fade-in-up 0.5s ease-out forwards;

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

/* Respect prefers-reduced-motion — Tailwind v4 built-in variant */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up {
    animation: none !important;
    opacity: 1 !important;
  }
}
```

Then in components:
```tsx
// Before:
<div style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }} className="rounded-xl ...">

// After:
<div className="animate-fade-in-up rounded-xl ...">
```

---

## Data Flow

### Current Flow (Monolithic)

```
User Input (PlanTab)
    ↓ (10-20 callback props)
App.tsx (all state)
    ↓ (useMemo: 4 projection computations)
    ↓ (useEffect: localStorage write)
    ↓ (10-20 data props per tab)
OverviewTab (pass-through)
    ↓ (10-15 data props per card)
SummaryCard / GoalsCard (each duplicate goal calculations)
```

### Target Flow (Context-Based)

```
User Input (PlanTab)
    ↓ dispatch({ type: 'UPDATE_PERSON', ... })
PeopleContext.useReducer → state.people updated
    ↓
AssumptionsContext ← user edits in AssumptionsPanel
    ↓
ProjectionContext reads PeopleContext + AssumptionsContext
    ↓ useMemo recalculates via WASM
    ↓
useProjectionData() → consumed by any card/tab directly
useRetirementGoal() → derived calculations consumed by SummaryCard + GoalsCard

Persistence: usePersistence hook reads all contexts → localStorage (no props)
```

### Key Data Flows

1. **Edit person/account:** Component calls `dispatch()` → `PeopleReducer` updates state → `PeopleContext` re-renders consumers → `ProjectionContext` recalculates (via `useMemo`) → data cards re-render with new projection.

2. **Change assumption:** Component calls `setExpectedReturn()` via `useAssumptionsUpdater()` → `AssumptionsContext` updates → `ProjectionContext` recalculates → all projection-dependent views update.

3. **Toggle real/future values:** `useAssumptionsUpdater().setShowRealValues()` → `AssumptionsContext` updates → `ProjectionContext` recalculates (inflation factor changes) → all views update.

4. **Import YAML:** `handleImport()` calls `uploadYAML()` → validates → dispatches `IMPORT_PLAN` to people reducer + calls assumption setters → single atomic state update → persistence hook writes to localStorage.

5. **WASM loading:** `useWasm()` hook calls `initWasm()` on mount → sets `wasmLoaded = true` → `ProjectionContext` recalculates (was returning `[]` before) → data appears.

---

## Component Boundaries

### Who Talks to What

| Component | Reads From | Dispatches To | Provides |
|-----------|-----------|---------------|----------|
| `PeopleProvider` | localStorage (init) | `PeopleReducer` | `PeopleState` + `PeopleDispatch` contexts |
| `AssumptionsProvider` | localStorage (init) | Internal `useState` | `AssumptionsState` + `AssumptionsUpdater` contexts |
| `ProjectionProvider` | `PeopleContext`, `AssumptionsContext`, `useWasm()` | None (pure derived) | `ProjectionData` context |
| `PlanTab` | `usePeople()`, `useAssumptions()` | `usePeopleDispatch()`, `useAssumptionsUpdater()` | — |
| `OverviewTab` | `usePeople()`, `useProjectionData()` | None | — |
| `SummaryCard` | `useRetirementGoal()` | None | — |
| `GoalsCard` | `useRetirementGoal()` | None | — |
| `GrowthChart` | `useProjectionData()` | None | — |
| `IncomeBreakdownCard` | `useProjectionData()`, `useAssumptions()` | None | — |
| `Header` | `useAssumptions()` | `useAssumptionsUpdater()`, import handler | — |
| `PersonForm` | `usePeople()` | `usePeopleDispatch()` | — |
| `AccountCard` | `usePeople()` (for account data) | `usePeopleDispatch()` | — |
| `usePersistence` | `usePeople()`, `useAssumptions()` | localStorage writes | — |

### Boundary Rules

1. **Components never import from `context/` internal types** — they use the exported hooks (`usePeople`, `usePeopleDispatch`, `useAssumptions`, etc.).
2. **Context providers never import components** — the dependency graph is one-directional: providers → hooks → lib utilities.
3. **`lib/` has zero React imports** — pure functions only, fully testable in Node without a DOM.
4. **`types/` has zero imports** — it's imported by everything else, never imports from the app.
5. **Dashboard components never appear in `components/` root** — shared components move up; tab-specific stay in `dashboard/`.

---

## Build Order (Dependency Sequence)

The refactoring must happen in a specific order due to interdependencies. Each step should be independently deployable.

```
Phase 1: Foundation (no behavior change)
  ├── 1a. Consolidate types → types/
  ├── 1b. Extract formatCurrency → lib/format.ts
  ├── 1c. Extract generateId → lib/ids.ts
  └── 1d. Extract update helpers → lib/update-helpers.ts (temporary, moves to reducer later)

Phase 2: Shared Components (no architecture change)
  ├── 2a. Extract NumberInput → components/NumberInput.tsx
  ├── 2b. Move animations to CSS utilities (Tailwind @theme)
  ├── 2c. Move autofill styles to shared stylesheet
  └── 2d. Create ErrorBoundary component

Phase 3: PeopleContext (first context, biggest impact)
  ├── 3a. Create PeopleReducer with typed actions + helpers
  ├── 3b. Create PeopleContext + PeopleProvider
  ├── 3c. Wire PeopleProvider in main.tsx
  └── 3d. Update PlanTab + children to use usePeople/usePeopleDispatch

Phase 4: AssumptionsContext (second context)
  ├── 4a. Create AssumptionsContext + AssumptionsProvider
  ├── 4b. Wire in main.tsx
  └── 4c. Update PlanTab/AssumptionsPanel to use context

Phase 5: ProjectionContext (third context, depends on 3+4)
  ├── 5a. Extract useWasm from useProjection
  ├── 5b. Create ProjectionContext consuming People + Assumptions
  ├── 5c. Wire in main.tsx
  └── 5d. Update OverviewTab, ProjectionsTab, IncomeTab to use context

Phase 6: Derived Hooks + Persistence (depends on 5)
  ├── 6a. Create useRetirementGoal hook
  ├── 6b. Simplify SummaryCard + GoalsCard to use hook
  ├── 6c. Create usePersistence hook (centralized localStorage)
  └── 6d. Slim down App.tsx to layout shell (~60 lines)
```

### Build Order Rationale

- **Types first** because everything else imports from `types/`. No component behavior changes.
- **Shared components second** because they're leaf changes — extract `NumberInput`, update two consumers.
- **PeopleContext third** because it's the most complex state domain (7 actions) and eliminates the most prop drilling. It has no dependency on other contexts.
- **AssumptionsContext fourth** because it's simpler (just `useState` values) and independent of PeopleContext.
- **ProjectionContext fifth** because it *depends on* both People and Assumptions contexts — it reads them to compute derived data. Cannot be built before 3+4.
- **Derived hooks last** because `useRetirementGoal` depends on `ProjectionContext` (which depends on 3+4).

---

## Anti-Patterns

### Anti-Pattern 1: Single God Context

**What people do:** Put all state (people, assumptions, projections, UI state) into one `AppContext`.
**Why it's wrong:** Every state change re-renders every consumer. Toggles like `showRealValues` would re-render `PersonForm` unnecessarily.
**Do this instead:** Split into domain contexts: `PeopleContext`, `AssumptionsContext`, `ProjectionContext`. Each has its own change frequency.

### Anti-Pattern 2: Context for Everything

**What people do:** Use Context for UI state that's only consumed by one component (e.g., `activeTab`).
**Why it's wrong:** Adds provider overhead for no benefit — `activeTab` is only read by `App.tsx` and `Tabs.tsx`, which are parent/child.
**Do this instead:** Keep `activeTab` as local state in `App.tsx`. Only use Context when data flows to 3+ consumers across multiple levels.

### Anti-Pattern 3: Reducer for Simple State

**What people do:** Use `useReducer` for assumptions that are just independent `useState` values.
**Why it's wrong:** A reducer for `{ expectedReturn, inflationRate, replacementRate, withdrawalRate, showRealValues }` adds boilerplate for 5 `SET_*` actions that are identical in structure.
**Do this instead:** Use individual `useState` calls in the provider, expose setter functions. Only reach for `useReducer` when updates have complex logic (like the people/accounts domain).

### Anti-Pattern 4: Moving All Persistence into Context

**What people do:** Put `localStorage.getItem`/`setItem` inside each context provider's initializer/effect.
**Why it's wrong:** Persistence becomes scattered across 3 providers. Import/export needs to read from all 3, creating coupling.
**Do this instead:** Keep persistence in a single `usePersistence` hook that reads from all contexts and writes to localStorage. Keep initialization in each provider (read-once from localStorage).

### Anti-Pattern 5: Premature Library Adoption

**What people do:** Reach for Zustand, Jotai, or Redux Toolkit for a 16-component app.
**Why it's wrong:** This app has ~10 state variables and 16 components. React Context + useReducer handles this cleanly. Adding a state management library adds dependency weight and learning curve for zero benefit.
**Do this instead:** Use native React Context. The architecture described here eliminates all prop drilling without external dependencies.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (16 components) | Three Context providers + useReducer. No external state library needed. |
| 2x components (~30) | Same architecture. May add more derived hooks if new card types emerge. |
| 3x+ components (~50+) | Consider extracting data-access hooks into a `hooks/` subdirectory per domain. Context providers stay the same. |

This app will likely never exceed 30–40 components. It's a retirement calculator, not a social platform. The Context + useReducer pattern is well-suited for this scale and has no migration path needed.

---

## Sources

- **React 19 Context as Provider:** Official React docs — `<Context value={}>` replaces `<Context.Provider>` in React 19. Source: react.dev/reference/react/createContext (HIGH confidence)
- **useReducer + Context pattern:** Official React docs "Scaling Up with Reducer and Context" — canonical pattern for complex state with multiple consumers. Source: react.dev/learn/scaling-up-with-reducer-and-context (HIGH confidence)
- **Split state/dispatch contexts:** React docs recommend separate Contexts for state vs dispatch to avoid re-rendering dispatch-only consumers. Source: react.dev reference on useContext (HIGH confidence)
- **Tailwind v4 @theme + @keyframes:** Official Tailwind v4 docs — custom animations via `--animate-*` in `@theme` block with inline `@keyframes`. Source: tailwindcss.com/docs/theme (HIGH confidence)
- **Tailwind motion-reduce variant:** Built-in `motion-reduce:` variant for `prefers-reduced-motion`. Source: tailwindcss.com docs (HIGH confidence)
- **Real-world Context patterns:** Foxglove Studio / Lichtblick Suite use identical split-context pattern with `useGuaranteedContext` guard hook. Source: github.com/lichtblick-suite (MEDIUM confidence — real production code)

---

*Architecture research for: Retire, Eh? codebase quality remediation*
*Researched: 2026-04-13*
