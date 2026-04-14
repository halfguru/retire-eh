# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Client-side SPA with Rust/WASM computation core — a two-tier architecture where a React frontend handles all UI and state, while a Rust-compiled WASM module performs financial calculations.

**Key Characteristics:**
- Zero backend server — entirely client-side, deployed as static files to GitHub Pages
- All state lives in React component state (App.tsx) with localStorage persistence
- Rust core compiled to WASM via wasm-pack, loaded asynchronously at runtime
- Unidirectional data flow: user input → React state → WASM computation → React re-render
- No routing library — tab-based navigation managed by simple state variable

## Layers

**Presentation Layer (React Components):**
- Purpose: Render UI, handle user interactions, display computed results
- Location: `frontend/src/components/`
- Contains: Functional React components with props-based interfaces
- Depends on: Hooks layer for state and data, Recharts for chart rendering
- Used by: End user via browser

**State & Logic Layer (React Hooks):**
- Purpose: Manage application state, coordinate WASM calls, persist to localStorage
- Location: `frontend/src/hooks/`
- Contains: Custom hooks (`usePeopleManagement`, `useProjection`, `useDarkMode`, `useLocalStorage`)
- Depends on: WASM loader for computation
- Used by: Presentation layer components

**Computation Layer (Rust/WASM):**
- Purpose: Perform financial projections and calculations with high precision
- Location: `backend/src/`
- Contains: Rust structs (models) and pure calculation functions
- Depends on: `wasm-bindgen`, `serde`, `serde-wasm-bindgen`
- Used by: State layer via WASM bridge

**Utility Layer:**
- Purpose: WASM loading, YAML import/export
- Location: `frontend/src/lib/`
- Contains: `wasm-loader.ts` (async WASM init), `yaml-utils.ts` (serialization)
- Depends on: WASM binary, `js-yaml` package
- Used by: Hooks and App.tsx

## Component Architecture

```
App.tsx (all state lives here)
├── Header.tsx                    # Logo, dark mode toggle, export/import, real/future $
├── Tabs.tsx                      # 5-tab navigation (sticky bar)
├── Tab Content (switch on activeTab):
│   ├── PlanTab.tsx               # Input form: people + assumptions
│   │   ├── PersonSelector.tsx    # Tab buttons for multi-person switching
│   │   ├── PersonForm.tsx        # Individual person editing form
│   │   │   ├── InfoTooltip.tsx   # Hover tooltips for field labels
│   │   │   └── AccountCard.tsx   # Single account (RRSP/TFSA) row with inputs
│   │   └── AssumptionsPanel.tsx  # Return rate, inflation, replacement, withdrawal
│   ├── OverviewTab.tsx           # Dashboard summary
│   │   ├── SummaryCard.tsx       # On-track status, progress %, additional savings needed
│   │   ├── ViewSelector.tsx      # Household vs individual person selector
│   │   ├── PortfolioCard.tsx     # Current portfolio total display
│   │   ├── RetirementProjectionCard.tsx  # Projected portfolio at retirement
│   │   └── GoalsCard.tsx         # Goal progress bar, gap analysis
│   ├── ProjectionsTab.tsx        # Growth chart + methodology explanation
│   │   └── GrowthChart.tsx       # Recharts LineChart (RRSP, TFSA, Total lines)
│   ├── IncomeTab.tsx             # Retirement income sources
│   │   └── IncomeBreakdownCard.tsx  # Portfolio withdrawal, CPP, OAS, pension breakdown
│   └── LearnTab.tsx              # Educational accordion content (static)
└── Footer.tsx                    # GitHub link
```

**Props flow pattern:**
All data and callbacks originate in `App.tsx` and are passed down as props through 1-2 levels. No Context API, no state management library. Each tab component receives exactly the data it needs.

## State Management

**Central state in `App.tsx` (`frontend/src/App.tsx`):**

| State Variable | Type | Default | Purpose |
|---|---|---|---|
| `activeTab` | `TabId` | `'plan'` | Which tab is displayed |
| `isDarkMode` | `boolean` | OS preference | Dark/light mode |
| `showRealValues` | `boolean` | `true` | Today's dollars vs future dollars |
| `expectedReturn` | `number` | `7.0` | Annual investment return % |
| `inflationRate` | `number` | `2.5` | Annual inflation % |
| `replacementRate` | `number` | `70` | Income replacement target % |
| `withdrawalRate` | `number` | `4.0` | Safe withdrawal rate % |
| `portfolioPersonId` | `string \| null` | first person's id | Which person for individual view |

**Delegated state via hooks:**

| Hook | File | State Managed |
|---|---|---|
| `usePeopleManagement` | `frontend/src/hooks/usePeopleManagement.ts` | `people[]`, `selectedPersonId`, all CRUD operations |
| `useProjection` | `frontend/src/hooks/useProjection.ts` | `wasmLoaded` flag, `calculateProjection` function |
| `useDarkMode` | `frontend/src/hooks/useDarkMode.ts` | `isDarkMode` + `document.documentElement.classList` toggle |

**Persistence:** All state saved to `localStorage` via a `useEffect` in `App.tsx` (the `saveToLocalStorage` callback). Individual hooks also read from localStorage for initialization.

**Derived state in `App.tsx` (computed via `useMemo`):**
- `projectionData` — household combined projection
- `individualProjectionData` — single person projection
- `currentProjectionData` — active view (combined or individual)
- `realProjectionData` — always in "today's dollars" (for goals/income)
- `totalPortfolio`, `totalAnnualContributions`, `totalAnnualIncome`, etc.

## Data Flow

**User Input → Computation → Display Pipeline:**

1. User edits a field in `PlanTab` (e.g., account balance, retirement age)
2. `PlanTab` calls an `onUpdate*` callback prop (e.g., `onUpdateAccountBalance`)
3. `App.tsx` updates state via `usePeopleManagement` hook → `setPeople(...)`
4. React re-renders `App.tsx`, recalculating all `useMemo` derived values
5. `useProjection.calculateProjection()` is called inside `useMemo` with new inputs
6. `calculateProjection()` aggregates accounts by type (RRSP/TFSA), calls WASM `calculator.calculate_yearly_projections()`
7. WASM returns yearly projection array, hook maps it to `ProjectionDataPoint[]` with inflation adjustment
8. Tab components receive new `projectionData` and re-render charts/cards

**State update cycle:**
```
User Input → callback prop → setPeople() → re-render App.tsx
→ useMemo recalculates projectionData → tab re-renders
→ useEffect saves to localStorage
```

**WASM loading flow:**
1. `useProjection` hook calls `initWasm()` in `useEffect` on mount
2. `wasm-loader.ts` fetches `/wasm/retirement_core_bg.wasm`, instantiates, creates `RetirementCalculator` singleton
3. `wasmLoaded` state set to `true`, enabling `calculateProjection` to return data
4. Before WASM loads, `calculateProjection` returns empty array `[]`

## WASM Bridge Architecture

**Build pipeline:**
```
backend/src/lib.rs → wasm-pack build --target web → backend/pkg/
  ├── retirement_core.js           # JS glue code (ES module)
  ├── retirement_core.d.ts         # TypeScript type declarations
  ├── retirement_core_bg.wasm      # Compiled WASM binary
  └── retirement_core_bg.wasm.d.ts # WASM-specific types
```

**Deployment pipeline:**
```
backend/pkg/retirement_core_bg.wasm  → frontend/public/wasm/
backend/pkg/retirement_core.js       → frontend/src/lib/
backend/pkg/retirement_core.d.ts     → frontend/src/lib/
```

**Bridge mechanics (`frontend/src/lib/wasm-loader.ts`):**
- `initWasm()` — async function, fetches WASM from `/wasm/retirement_core_bg.wasm`, initializes singleton
- `getCalculator()` — synchronous, returns `RetirementCalculator` instance (throws if not initialized)
- Module-level variables track initialization state (`wasmInitialized`, `calculator`)

**Serialization approach:**
- Rust structs use `serde::Serialize` / `serde::Deserialize`
- `serde_wasm_bindgen` converts between Rust types and JS objects
- WASM functions accept `JsValue` parameters, deserialize internally
- Return values serialized back to `JsValue` via `serde_wasm_bindgen::to_value()`

**Rust API surface (`backend/src/lib.rs`):**

| Method | Input | Output | Used By |
|---|---|---|---|
| `calculate_projection` | HouseholdConfig, AccountBalance, ContributionConfig, Children[], Assumptions, currentAge | RetirementProjection | Not currently used by frontend |
| `calculate_yearly_projections` | HouseholdConfig, AccountBalance, ContributionConfig, Assumptions, currentAge | YearlyProjection[] | `useProjection` hook (primary path) |
| `calculate_simple_projection` | totalPortfolio, currentAge, retirementAge, returnRate, currentYear | SimpleProjection[] | Not currently used by frontend |
| `calculate_additional_annual_savings` | currentPortfolio, targetPortfolio, years, returnRate, inflationRate, currentContributions | f64 | `SummaryCard`, `GoalsCard` |

## Key Design Patterns

**Lifted State Pattern:**
All mutable state lives in `App.tsx`. Child components receive data and callbacks via props. No Context API, no Redux, no Zustand. This keeps the architecture simple at the cost of prop drilling.

**Hook-based Encapsulation:**
Complex state logic extracted into custom hooks (`usePeopleManagement`, `useProjection`, `useDarkMode`, `useLocalStorage`). Each hook manages its own slice of state and exposes a clean API.

**Graceful WASM Degradation:**
Components that call WASM (`SummaryCard`, `GoalsCard`) include `try/catch` fallbacks that compute approximate results in pure JavaScript when WASM is not yet loaded.

**Singleton WASM Calculator:**
A single `RetirementCalculator` instance is created once during app initialization and reused for all subsequent calculations. This avoids repeated WASM initialization overhead.

**Real vs Nominal Value Toggle:**
The `showRealValues` boolean controls whether projection data is displayed in "today's dollars" (inflation-adjusted) or nominal future dollars. The inflation adjustment happens in `useProjection.calculateProjection()` using `Math.pow(1 + inflationRate / 100, yearsFromNow)`.

**Portfolio View Switching:**
The app supports "household" (combined all people) and "individual" (single person) views. Controlled by `portfolioPersonId` state in `App.tsx`. When `null`, shows household view; when a person ID, shows that person's data.

**Tab-based Navigation:**
No router. A `TabId` union type (`'overview' | 'plan' | 'projections' | 'income' | 'learn'`) determines which component renders. The `Tabs` component renders the navigation bar; `App.tsx` uses a `switch` statement.

**LocalStorage Persistence:**
State is serialized to localStorage on every change via a `useEffect` with a `saveToLocalStorage` callback. Initialization reads from localStorage with fallback defaults.

**YAML Import/Export:**
Full plan state can be exported to a YAML file and re-imported. Uses `js-yaml` library. Export creates a versioned `RetirementPlan` object; import validates structure before applying.

## Error Handling

**Strategy:** Component-level try/catch with fallbacks, no global error boundary.

**Patterns:**
- WASM calls wrapped in `try/catch` with JS fallback calculations (`SummaryCard.tsx`, `GoalsCard.tsx`)
- YAML parsing wrapped in `try/catch` with `null` return (`yaml-utils.ts`)
- Empty state guards: `if (yearsToRetirement <= 0 || !wasmLoaded) return []`
- JSON.parse in localStorage init wrapped in `try/catch` with default fallbacks

## Cross-Cutting Concerns

**Styling:** Tailwind CSS v4 with `@tailwindcss/vite` plugin. Dark mode via `.dark` class on `<html>`. Custom theme colors defined in `frontend/src/index.css` using `@theme` directive.

**Formatting:** Currency values formatted with `toLocaleString('en-CA')` throughout. Custom `NumberInput` component in `PersonForm.tsx` and `AccountCard.tsx` shows formatted values on blur, raw numbers on focus.

**Accessibility:** Minimum 44px touch targets on interactive elements. `aria-label` on tab navigation. `aria-current="page"` on active tab.

**Responsive:** Mobile-first with `sm:` and `md:` breakpoints. Sticky tab bar. Horizontal scrolling tabs on mobile. Grid layouts collapse to single column.

---

*Architecture analysis: 2026-04-13*
