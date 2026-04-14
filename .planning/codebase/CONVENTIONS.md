# Coding Conventions

**Analysis Date:** 2026-04-13

## TypeScript/React Conventions

### Component Naming

- **Named exports** only — never `export default` for components (except `App.tsx` which uses `export default`)
- **PascalCase** for component names: `SummaryCard`, `PlanTab`, `PersonForm`
- All component files are named with **PascalCase**: `Header.tsx`, `Tabs.tsx`, `AccountCard.tsx`

```typescript
// Named export (standard pattern)
export function Header({ isDarkMode, ... }: HeaderProps) {
  return (...)
}

// Default export (only App.tsx)
export default App
```

### File Naming

- **Components:** PascalCase — `SummaryCard.tsx`, `GrowthChart.tsx`, `InfoTooltip.tsx`
- **Hooks:** camelCase with `use` prefix — `useDarkMode.ts`, `useProjection.ts`, `usePeopleManagement.ts`
- **Utilities/Libs:** kebab-case — `yaml-utils.ts`, `wasm-loader.ts`
- **Types:** camelCase — `household.ts`
- **Styles:** lowercase — `index.css`, `App.css`

### Component Structure Pattern

Every component follows this order:

1. Imports
2. Interface definition (props type) — named `ComponentNameProps`
3. Export function declaration with destructured props
4. Logic/hooks
5. Return JSX

```typescript
// Standard component pattern
import type { Person } from '@/hooks/usePeopleManagement'
import { InfoTooltip } from './InfoTooltip'

interface PlanTabProps {
  people: Person[]
  selectedPersonId: string | null
  onAddAccount: (personId: string, type: 'RRSP' | 'TFSA') => void
}

export function PlanTab({
  people,
  selectedPersonId,
  onAddAccount
}: PlanTabProps) {
  // logic here
  return (
    <div>...</div>
  )
}
```

### Props Interface Pattern

- Define props interface **in the same file** as the component, above the function
- Use **inline object types** for nested callback signatures
- Use `type` aliases for union types; `interface` for object shapes

```typescript
// Props defined inline above component
interface OverviewTabProps {
  people: Person[]
  currentProjectionData: ProjectionDataPoint[]
  onPersonChange: (id: string | null) => void
}

// Inline callback types in props
interface PersonFormProps {
  onUpdateAccountBalance: (personId: string, accountId: string, balance: number) => void
}
```

### Import Ordering

1. React imports (`useState`, `useEffect`, `useMemo`, etc.)
2. CSS imports (`./App.css`, `./index.css`)
3. Third-party library imports (`recharts`, `js-yaml`)
4. Absolute path imports using `@/` alias (`@/hooks/`, `@/components/`, `@/lib/`, `@/types/`)
5. Relative imports (`./SummaryCard`, `../Header`)

```typescript
import { useMemo, useState, useEffect, useCallback } from 'react'
import './App.css'
import { useDarkMode } from '@/hooks/useDarkMode'
import { usePeopleManagement } from '@/hooks/usePeopleManagement'
import { Header } from '@/components/Header'
import { SummaryCard } from './SummaryCard'
```

### Path Aliases

- **`@/*`** maps to `./src/*` (configured in `frontend/tsconfig.app.json` and `frontend/vite.config.ts`)
- Use `@/` for all cross-module imports (hooks, components, lib, types)
- Use `./` for same-directory imports (e.g., sibling components in `dashboard/`)

### Type Definition Patterns

- **Co-locate domain types with the hook that uses them**: `Person` and `Account` types live in `frontend/src/hooks/usePeopleManagement.ts`
- **Shared types in `types/`**: `frontend/src/types/household.ts` for WASM-bound types
- **WASM binding types**: Generated `.d.ts` files in `frontend/src/lib/` — do not manually edit
- **Interface vs type**: Use `interface` for object shapes; `type` for unions and aliases

```typescript
// Interface for object shapes
export interface Account {
  id: string
  type: 'RRSP' | 'TFSA'
  balance: number
  annualContribution: number
}

// Type for union/alias
type TabId = 'overview' | 'plan' | 'projections' | 'income' | 'learn'
```

### Hook Conventions

- Hooks are **named exports** in `frontend/src/hooks/`
- Each hook is in its own file
- Return object with named properties (not arrays, except `useDarkMode` and `useLocalStorage`)
- Hooks handle their own localStorage persistence internally
- Use `as const` for tuple returns

```typescript
// Standard hook return (object)
export function usePeopleManagement() {
  // ...
  return {
    people,
    setPeople,
    addPerson,
    deletePerson,
    updatePerson,
    getCurrentPerson
  }
}

// Tuple return pattern (useDarkMode, useLocalStorage)
return [isDarkMode, setIsDarkMode] as const
```

### State Management Pattern

- **All state lives in `App.tsx`** — no context providers, no global state libraries
- Tab components receive all data and callbacks via props
- Hooks encapsulate related state logic: `usePeopleManagement`, `useProjection`, `useDarkMode`
- localStorage is used for persistence — state reads from localStorage on init, writes on change

### Error Handling (Frontend)

- Use `try/catch` with `console.error` and graceful fallbacks
- WASM calls wrapped in try/catch with fallback calculations
- Empty-state returns (`return []`, `return null`) for invalid inputs

```typescript
try {
  const calculator = getCalculator()
  return calculator.calculate_yearly_projections(...)
} catch (error) {
  console.error('Error calculating projection:', error)
  return []
}
```

## Rust Conventions

### Module Organization

- **`lib.rs`**: Public API surface — `pub mod` declarations and `#[wasm_bindgen]` struct/impl
- **`models.rs`**: Data structures with `Serialize`/`Deserialize`
- **`calculations.rs`**: Pure calculation functions (no WASM bindings)
- **Empty `mod/` directories** exist for future expansion (`calculations/`, `models/`)

### Naming Conventions

- **snake_case** for functions, variables, modules
- **PascalCase** for structs and enums
- **SCREAMING_SNAKE_CASE** for constants (if any)
- Struct fields use **snake_case** even though they serialize to JS

```rust
pub fn calculate_yearly_projections(
    household_config: &HouseholdConfig,
    account_balance: &AccountBalance,
    contributions: &ContributionConfig,
    assumptions: &Assumptions,
    current_age: u32,
) -> Vec<YearlyProjection> { ... }
```

### Type Design Patterns

- All public structs derive `Debug, Clone, Serialize, Deserialize`
- WASM bridge structs use `serde_wasm_bindgen` for conversion
- The `SimpleProjection` struct uses `#[serde(rename_all = "camelCase")]` for JS compatibility
- Use references (`&`) for function parameters, return owned values

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YearlyProjection {
    pub year: u32,
    pub age: u32,
    pub rrsp: f64,
    pub tfsa: f64,
    pub resp: f64,
    pub non_registered: f64,
    pub total_net_worth: f64,
}
```

### Error Handling (Rust)

- WASM bridge methods return `Result<JsValue, JsValue>`
- Errors created with `JsValue::from_str(&format!(...))` for descriptive messages
- Pure calculation functions do not return `Result` — they use guard clauses and defaults
- Use `saturating_sub` for safe arithmetic

```rust
pub fn calculate_projection(...) -> Result<JsValue, JsValue> {
    let household_config: HouseholdConfig = serde_wasm_bindgen::from_value(household_config_js)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse household config: {}", e)))?;
    // ...
}
```

### WASM Bridge Pattern

- `RetirementCalculator` is a `#[wasm_bindgen]` struct with a constructor
- It delegates to pure Rust functions in `calculations.rs`
- JS values are deserialized via `serde_wasm_bindgen::from_value`
- Results are serialized via `serde_wasm_bindgen::to_value`
- Keep `lib.rs` thin — all logic in `calculations.rs`

## Styling Conventions

### CSS Approach

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin — utility-first
- **Dark mode**: class-based (`dark:` prefix), toggled via `.dark` class on `<html>`
- **No CSS modules** — all styling via Tailwind utility classes
- **Minimal custom CSS** in `frontend/src/index.css` (theme variables, number input styling)
- **Animation CSS** in `frontend/src/App.css` (`fadeInUp` keyframe)

### Theme System

- Custom theme defined in `frontend/src/index.css` using Tailwind v4 `@theme` directive
- Semantic color variables: `--color-primary`, `--color-secondary`, `--color-warning`, `--color-error`
- Account type colors via CSS classes: `.account-rrsp` (indigo), `.account-tfsa` (emerald)
- Dark mode custom variant: `@custom-variant dark (&:where(.dark, .dark *))`

### Responsive Design Pattern

- **Mobile-first** — base styles target mobile, `sm:` and `md:` breakpoints scale up
- Standard breakpoints: `sm:`, `md:`, `lg:`
- Touch-friendly: minimum 44px hit areas (`min-h-[44px]`)
- Tabs scroll horizontally on mobile (`overflow-x-auto`)

```tsx
// Typical responsive pattern
<div className="px-4 py-4 sm:py-6 max-w-7xl mx-auto">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
```

### Dark Mode Pattern

- Every color utility has a dark variant: `text-gray-800 dark:text-white`
- Backgrounds: `bg-white dark:bg-gray-800`
- Borders: `border-gray-200 dark:border-gray-700`
- The `useDarkMode` hook toggles the `.dark` class on `<html>` and persists to localStorage

## Formatting Configuration

### EditorConfig (`.editorconfig`)

| Setting | Value |
|---------|-------|
| Charset | UTF-8 |
| Line endings | LF |
| Final newline | Yes |
| Trim whitespace | Yes |
| TS/TSX/JS/JSX/CSS/JSON/YAML indent | 2 spaces |
| Rust (`.rs`) indent | 4 spaces |
| TOML indent | 4 spaces |

### ESLint (`frontend/eslint.config.js`)

- ESLint v9 flat config
- Extends: `js.configs.recommended`, `tseslint.configs.recommended`
- Plugins: `react-hooks` (recommended rules), `react-refresh` (Vite)
- Target: `ES2020`, browser globals
- **No custom rules** — uses recommended defaults

### TypeScript (`frontend/tsconfig.app.json`)

- **Strict mode** enabled
- `noUnusedLocals`, `noUnusedParameters` — no dead code
- `noFallthroughCasesInSwitch` — exhaustive switches
- Target: `ES2022`, JSX: `react-jsx`
- Module resolution: `bundler` (Vite)
- `verbatimModuleSyntax` — explicit `type` imports required

### Rust Formatting

- Uses default `rustfmt` style (no `rustfmt.toml`)
- Uses default Clippy rules (`cargo clippy -- -D warnings`)
- CI enforces `cargo fmt -- --check`

## Git Conventions

### Commit Messages

- Varied style — primarily descriptive phrases
- Examples from history:
  - `fix: revert @eslint/js to v9 for compatibility with eslint v9`
  - `Add tabbed UI layout for Retire, Eh?`
  - `Bump the dependencies group in /frontend with 4 updates`
  - `Replace Dependabot with Renovate for native automerge support`
- No strict conventional commits enforcement (some use `fix:` prefix, most do not)

### Branch Strategy

- `main` — production, auto-deploys to GitHub Pages
- `develop` — development branch (CI runs)
- Dependency update branches created by Renovate

### PR Workflow

- PRs require CI to pass (typecheck, lint, build, Rust tests)
- Renovate automerges minor/patch dependency updates
- Major updates require manual review

## Documentation Conventions

### Comments

- **Minimal comments** — code is self-documenting via clear naming
- No JSDoc/TSDoc usage in TypeScript code
- No doc comments in Rust code
- AGENTS.md serves as the developer reference document

### Inline Styles

- Used sparingly for dynamic values (e.g., `animation` styles)
- CSS-in-JS `<style>` tags appear in `NumberInput` components for autofill overrides — **not a standard pattern to follow**

---

*Convention analysis: 2026-04-13*
