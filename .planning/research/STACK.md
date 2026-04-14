# Stack Research

**Domain:** Code quality remediation for React 19 + Rust/WASM retirement planning SPA
**Researched:** 2026-04-13
**Confidence:** HIGH

## Recommended Stack

### Testing Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| vitest | ^4.1.4 | Test runner | Native Vite 7 integration (peer dep `vite: ^6 \|\| ^7 \|\| ^8`), zero-config, Jest-compatible API, built-in coverage. Faster than Jest for Vite projects because it reuses Vite's transform pipeline. |
| @testing-library/react | ^16.3.2 | Component testing | React 19 compatible (peer dep `react: ^18 \|\| ^19`). Queries DOM like a user (by role, text, label) — tests survive refactoring. |
| @testing-library/jest-dom | ^6.9.1 | DOM assertions | Custom matchers like `toHaveTextContent`, `toBeInTheDocument`. Vitest-compatible (peer dep `vitest: >= 0.32`). |
| @testing-library/user-event | ^14.6.1 | User interaction simulation | Dispatches real browser events (click, type, tab) in the correct order. More realistic than `fireEvent`. |
| jsdom | ^29.0.2 | DOM environment for tests | Lightweight DOM implementation for running component tests in Node. Required for `environment: 'jsdom'` in vitest config. |
| @vitest/coverage-v8 | ^4.1.4 | Code coverage reporting | Native V8 coverage provider for vitest 4. Generates text/HTML/JSON reports. |

### Runtime Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| zod | ^4.3.6 | YAML import schema validation | **Overrides prior manual-validation decision.** Zod 4 is 6.5x faster than v3, provides type inference from schemas (DRY principle — define schema once, get TypeScript types for free), and gives clear error messages for malformed imports. The YAML import path is security-critical — manual validation is error-prone for nested objects with 20+ fields. Bundle cost (~13KB gzipped core) is negligible alongside 76KB WASM + Recharts. |

### Error Handling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-error-boundary | ^6.1.1 | Error boundary wrapper | React 19 compatible (peer dep `react: ^18 \|\| ^19`). Provides `ErrorBoundary` component, `useErrorBoundary` hook for async/event errors, `resetKeys` for automatic retry, and `fallbackRender` for custom error UI. Avoids writing class components. |

### WASM Build & Testing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| wasm-bindgen (existing) | 0.2 | Rust/JS interop | Already in use. Keep current version. |
| wasm-bindgen-test | 0.2 (Rust dev-dep) | WASM bridge integration tests | Official testing framework for `wasm-bindgen`. Runs tests compiled to WASM in a headless browser, testing the actual JS↔Rust serialization boundary. Add as `[dev-dependencies]` in `backend/Cargo.toml`. |

### State Management (No New Dependencies)

| Pattern | Purpose | Why Recommended |
|---------|---------|-----------------|
| React Context + useReducer | Decompose App.tsx state | **No library needed.** Official React pattern from react.dev: split state and dispatch into separate contexts (`PeopleStateContext` + `PeopleDispatchContext`) to prevent unnecessary re-renders. The app has ~3 state domains (people, assumptions, UI) — Redux/Zustand would be over-engineering. |

## Installation

```bash
# Frontend dev dependencies (from frontend/ directory)
npm install -D vitest@^4.1.4 jsdom@^29.0.2 \
  @testing-library/react@^16.3.2 \
  @testing-library/jest-dom@^6.9.1 \
  @testing-library/user-event@^14.6.1 \
  @vitest/coverage-v8@^4.1.4 \
  @types/react@^19.2.14 @types/react-dom@^19.2.3

# Frontend dependencies (runtime)
npm install zod@^4.3.6 react-error-boundary@^6.1.1

# Rust dev dependency (from backend/ directory)
# Add to backend/Cargo.toml [dev-dependencies]:
# wasm-bindgen-test = "0.2"
```

## Detailed Recommendations

### 1. Testing React 19 + TypeScript with Vitest

**Setup configuration** (add to `vite.config.ts` or create `vitest.config.ts`):

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.*', 'src/test/**'],
    },
    clearMocks: true,
    restoreMocks: true,
  },
})
```

**Test setup file** (`src/test/setup.ts`):

```typescript
import '@testing-library/jest-dom/vitest'
```

**Add test scripts** to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Testing strategy by layer:**

| Layer | What to Test | Tool | Example |
|-------|-------------|------|---------|
| Pure functions | `formatCurrency`, `yaml-utils` import/export | `vitest` directly | `test('formatCurrency handles strings', ...)` |
| Custom hooks | `usePeopleManagement`, `useLocalStorage` | `renderHook` from `@testing-library/react` | `renderHook(() => usePeopleManagement())` |
| Components | `SummaryCard`, `NumberInput` | `render` + `screen` from `@testing-library/react` | `render(<SummaryCard />); expect(screen.getByText(...))` |
| User interactions | Form inputs, buttons | `userEvent` from `@testing-library/user-event` | `await userEvent.type(input, '1000')` |

**Priority test targets** (from CONCERNS.md):

1. `yaml-utils.ts` — Import/export round-trips (security-critical, pure functions, easy to test)
2. `usePeopleManagement.ts` — State mutations, CRUD operations (core business logic)
3. `wasm-loader.ts` — Init/error handling (mock WASM module, test wrapper logic)
4. `formatCurrency` utility — Number formatting edge cases (after extraction)

### 2. Testing Rust/WASM Bridge

**Two-level approach:**

**Level 1: Expand Rust unit tests** (no WASM needed, runs in native Rust):
- Test `calculate_projection`, `calculate_yearly_projections`, `calculate_simple_projection`
- Add edge cases: zero balances, max ages, zero return rate, negative inputs
- These tests run with `cargo test` — fast, no browser needed

**Level 2: WASM bridge tests with `wasm-bindgen-test`:**
- Add to `backend/Cargo.toml`:
  ```toml
  [dev-dependencies]
  wasm-bindgen-test = "0.2"
  ```
- Write tests in `backend/tests/` annotated with `#[wasm_bindgen_test]`
- Run with: `wasm-pack test --node` (Node.js environment) or `wasm-pack test --headless --chrome` (browser)
- Tests verify `serde-wasm-bindgen` serialization/deserialization works correctly

**Level 3: JS-side integration tests** (optional, lower priority):
- In vitest, mock the WASM module and test that JS wrapper code calls the right functions with correct argument shapes
- Don't try to load actual WASM in jsdom — it doesn't support WebAssembly streaming compilation

### 3. React State Management: Context + useReducer Pattern

**The official React pattern** (from react.dev "Scaling Up with Reducer and Context"):

Split each state domain into **two separate contexts** — one for state, one for dispatch:

```typescript
// Example: PeopleContext.tsx
import { createContext, useContext, useReducer } from 'react'
import type { Person } from '@/types'

// Separate contexts prevent re-renders when only dispatch is needed
const PeopleStateContext = createContext<Person[] | null>(null)
const PeopleDispatchContext = createContext<React.Dispatch<Action> | null>(null)

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const [people, dispatch] = useReducer(peopleReducer, initialPeople)
  return (
    <PeopleStateContext value={people}>
      <PeopleDispatchContext value={dispatch}>
        {children}
      </PeopleDispatchContext>
    </PeopleStateContext>
  )
}

// Custom hooks with null checks for developer experience
export function usePeople() {
  const ctx = useContext(PeopleStateContext)
  if (!ctx) throw new Error('usePeople must be used within PeopleProvider')
  return ctx
}

export function usePeopleDispatch() {
  const ctx = useContext(PeopleDispatchContext)
  if (!ctx) throw new Error('usePeopleDispatch must be used within PeopleProvider')
  return ctx
}
```

**Why this pattern over alternatives:**

| Option | Why Not |
|--------|---------|
| Redux Toolkit | Over-engineering for 3 state domains, adds 2 deps, boilerplate |
| Zustand | Simple but unnecessary — React Context handles this app's complexity |
| Jotai/Recoil | Atomic state model doesn't match the app's domain (people list + assumptions) |
| Keep in App.tsx | 271 lines of state + persistence + UI — unmaintainable |

**Recommended context decomposition:**

| Context | State | Reducer Actions |
|---------|-------|----------------|
| `PeopleContext` | `people: Person[]` | add/remove/update person, add/remove/update account |
| `AssumptionsContext` | `assumptions: Assumptions` | update rate, update ages, toggle real values |
| `UIContext` | `activeTab`, `darkMode`, `showRealValues`, `portfolioView` | set tab, toggle dark mode, toggle real values |

### 4. Runtime Validation: Zod 4 for YAML Import

**Why override the "manual validation" decision:**

The PROJECT.md originally chose manual validation to avoid a dependency. This is a false economy for the YAML import path:

1. **Security-critical**: Unvalidated YAML imports can corrupt state with malformed data (negative ages, Infinity balances, arbitrary extra fields). Manual validation for 20+ fields across nested objects is error-prone and brittle.

2. **Type safety**: Zod schemas produce TypeScript types via `z.infer<>`. Define the schema once, get both runtime validation and compile-time types — no drift between validation and type definitions.

3. **Zod 4 improvements**: 6.5x faster than v3, stable since April 2025, tree-shakeable. The `zod/v4/mini` subpackage is ~2.5KB gzipped if bundle size is a concern.

4. **Clear error messages**: Zod produces structured error objects with field paths — helpful for user-facing import error feedback.

**Schema example for this project:**

```typescript
import { z } from 'zod'

const AccountSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['pretax', 'roth', 'taxable', 'hsa']),
  balance: z.number().min(0).finite(),
  annualContribution: z.number().min(0).finite(),
})

const PersonSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  currentAge: z.number().int().min(18).max(120),
  retirementAge: z.number().int().min(30).max(100),
  accounts: z.array(AccountSchema),
})

const RetirementPlanSchema = z.object({
  assumptions: z.object({
    expectedReturn: z.number().min(-0.5).max(1),
    inflationRate: z.number().min(-0.1).max(1),
    withdrawalRate: z.number().min(0.001).max(0.2),
  }),
  people: z.array(PersonSchema).min(1),
})

export type RetirementPlan = z.infer<typeof RetirementPlanSchema>
```

**For simple form input validation** (ranges, negative values): manual validation is fine. Don't use Zod for every `<input>` — use it only for the YAML import security boundary.

### 5. Error Boundary Patterns for React 19

**React 19 still requires class components for error boundaries.** Use `react-error-boundary` to avoid writing classes:

**App-level boundary** (wraps everything):
```tsx
<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div className="p-8 text-center">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )}
  onReset={() => window.location.reload()}
>
  <App />
</ErrorBoundary>
```

**Tab-level boundaries** (granular — one tab crash doesn't kill the rest):
```tsx
<ErrorBoundary
  fallback={<TabErrorFallback />}
  onError={(error) => console.error('Tab error:', error)}
>
  {activeTab === 'overview' && <OverviewTab />}
  {activeTab === 'projections' && <ProjectionsTab />}
  {/* ... */}
</ErrorBoundary>
```

**WASM-specific boundary** (wraps WASM-dependent components):
```tsx
<ErrorBoundary
  fallbackRender={({ resetErrorBoundary }) => (
    <div className="p-4 bg-yellow-50 rounded">
      <p>Unable to load calculation engine.</p>
      <button onClick={resetErrorBoundary}>Retry</button>
    </div>
  )}
>
  {wasmLoaded ? children : <WasmLoadingSkeleton />}
</ErrorBoundary>
```

**For async errors** (event handlers, WASM init): Use the `useErrorBoundary` hook:
```tsx
const { showBoundary } = useErrorBoundary()

// In async code:
try {
  await initWasm()
} catch (error) {
  showBoundary(error) // Triggers nearest ErrorBoundary
}
```

### 6. WASM Cache Busting Strategy

**Problem**: WASM binary is in `public/wasm/` and loaded with a hardcoded path `/wasm/retirement_core_bg.wasm`. After a deploy, browsers may serve a cached old WASM binary while new JS bindings expect a different interface.

**Solution: Move WASM into Vite's asset pipeline.**

Vite 7 natively supports `?url` imports for WASM files, which automatically adds content hashes in production builds.

**Implementation:**

1. **Move WASM binary location**: Copy to `src/lib/` (alongside JS bindings) instead of `public/wasm/`:

   ```bash
   # Update build pipeline: copy WASM next to JS bindings
   cp backend/pkg/retirement_core_bg.wasm frontend/src/lib/
   cp backend/pkg/retirement_core.js frontend/src/lib/
   cp backend/pkg/retirement_core.d.ts frontend/src/lib/
   ```

2. **Import WASM URL through Vite** in `wasm-loader.ts`:

   ```typescript
   import init, { RetirementCalculator } from './retirement_core.js'
   import wasmUrl from './retirement_core_bg.wasm?url'  // Vite adds content hash
   import type { RetirementCalculator as RetirementCalculatorType } from './retirement_core.d.ts'

   let wasmInitialized = false
   let calculator: RetirementCalculatorType | null = null

   export async function initWasm() {
     if (wasmInitialized) return calculator
     await init(wasmUrl)  // Content-hashed URL from Vite
     calculator = new RetirementCalculator()
     wasmInitialized = true
     return calculator
   }
   ```

3. **Remove `public/wasm/` directory** — no longer needed.

4. **Update `.gitignore`** for generated files if not already.

**Why this works**: Vite's `?url` import returns the resolved public URL. In dev, it's the original path. In production builds, Vite copies the file to `assets/` with a content hash like `retirement_core_bg-AbCdEf.wasm` — busting cache automatically when the WASM binary changes.

**Alternative considered**: Query string busting (`?v=${hash}`) — simpler but GitHub Pages CDN may not respect query strings on binary assets. Content hash in filename is more reliable.

### 7. Code Organization for React + Heavy Computation Backend

**Recommended directory structure:**

```
frontend/src/
├── types/                    # Consolidated domain types
│   ├── index.ts             # Re-exports
│   ├── person.ts            # Person, Account types (single source of truth)
│   ├── assumptions.ts       # Assumptions type
│   ├── projection.ts        # ProjectionData, YearlyProjection types
│   └── wasm.ts              # WASM-facing types (household.ts)
├── contexts/                 # React Context providers
│   ├── PeopleContext.tsx     # People state + dispatch
│   ├── AssumptionsContext.tsx # Assumptions state + dispatch
│   └── UIContext.tsx         # Dark mode, active tab, toggles
├── hooks/                    # Custom hooks
│   ├── usePeopleManagement.ts  # People CRUD (consumes context)
│   ├── useProjection.ts     # WASM projection wrapper
│   ├── useLocalStorage.ts   # Persistence (adopt or remove)
│   └── useRetirementGoal.ts # Shared goal calculations (new, extracted)
├── lib/                      # Pure utilities + WASM integration
│   ├── wasm-loader.ts       # WASM init + cache
│   ├── retirement_core.js   # Generated WASM bindings
│   ├── retirement_core.d.ts # Generated type declarations
│   ├── retirement_core_bg.wasm  # WASM binary (Vite asset)
│   ├── yaml-utils.ts        # YAML import/export with Zod validation
│   ├── format.ts            # formatCurrency, formatCompactCurrency
│   └── constants.ts         # App-wide constants
├── components/
│   ├── ui/                   # Shared UI components
│   │   ├── NumberInput.tsx   # Unified number input (extracted)
│   │   ├── ErrorFallback.tsx # Error boundary fallback UI
│   │   └── LoadingSkeleton.tsx
│   ├── dashboard/            # Tab-specific components
│   │   ├── OverviewTab.tsx
│   │   ├── PlanTab.tsx
│   │   ├── ProjectionsTab.tsx
│   │   ├── IncomeTab.tsx
│   │   └── LearnTab.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Tabs.tsx
├── test/                     # Test infrastructure
│   └── setup.ts              # @testing-library/jest-dom/vitest
├── App.tsx                   # Layout + providers
├── main.tsx                  # Entry point
└── index.css                 # Global styles + Tailwind
```

**Key principles:**
- **`types/` is the single source of truth** — no types defined in hooks or components
- **`contexts/` hold state, `hooks/` hold logic** — contexts provide state/dispatch, hooks encapsulate business logic
- **`lib/` is pure** — no React, no side effects (except wasm-loader which is initialization)
- **Generated files stay in `lib/`** — WASM bindings live next to the loader that uses them
- **Test files co-located** — `Component.test.tsx` next to `Component.tsx`

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| vitest 4.x | vitest 3.x | If stuck on Vite 5 or below (v3 doesn't require Vite peer dep) |
| jsdom | happy-dom | If jsdom is too slow or missing DOM APIs you need; happy-dom is faster but less complete |
| Zod 4 | Zod 3 | Only if already using Zod 3 with complex schemas that haven't been migrated; Zod 4 has breaking changes |
| Zod 4 | Manual validation | If the only validation is simple range checks on 2-3 fields (not the case for YAML import) |
| react-error-boundary | Hand-rolled class component | If you want zero dependencies; but you'll write the same class component repeatedly |
| Context + useReducer | Zustand | If state updates become complex with many interdependencies; Zustand has simpler API for medium complexity |
| Vite `?url` import | Query string cache busting | If moving WASM to Vite pipeline is too disruptive; simpler but less reliable with CDNs |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Jest | Requires custom Vite transform config (`@jest/globals`, `ts-jest` or `@swc/jest`). Vitest reuses Vite config directly — zero setup. | vitest |
| Enzyme | Deprecated for React 18+. Does not support React 19. Shallow rendering is an anti-pattern. | @testing-library/react |
| React Testing Library `renderHook` (standalone) | Merged into `@testing-library/react` v16. The standalone package is deprecated. | `renderHook` from `@testing-library/react` v16 |
| Redux Toolkit | Adds 2 dependencies for 3 state domains. This app doesn't have cross-component async orchestration needs. | Context + useReducer |
| `fireEvent` from testing-library | Fires synthetic DOM events, doesn't go through full event pipeline. Misses focus, blur, etc. | `userEvent` from `@testing-library/user-event` |
| `wasm-pack test --web` (browser WASM tests) | Requires a headless browser. For Rust unit tests, `cargo test` is faster. For bridge tests, `--node` is simpler. | `cargo test` for Rust unit tests, `wasm-pack test --node` for bridge tests |
| `?raw` WASM import | Loads entire WASM binary as a buffer in JS bundle. Use `?url` to keep WASM as a separate network request (better caching). | `?url` import |

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| vitest | ^4.1.0+ | Vite ^6 \|\| ^7 \|\| ^8 | Earlier vitest 4.0.x did NOT list Vite as peer dep — use 4.1.0+ |
| @testing-library/react | ^16.1.0+ | React ^18 \|\| ^19 | 16.0.x only supported React 18; 16.1.0+ added React 19 |
| react-error-boundary | ^6.0.1+ | React ^18 \|\| ^19 | 6.0.0 only supported React 16+; 6.0.1+ added React 19 |
| @testing-library/jest-dom | ^6.0.0+ | vitest >= 0.32 | Any vitest 4.x satisfies this |
| zod | ^4.0.0 | Any TypeScript | Zod 4 has breaking API changes from v3 (different import paths, some method renames) |
| jsdom | ^29.0.0 | Node 18+ | Project uses Node 20 in CI — compatible |

## Sources

- `/vitest-dev/vitest` (Context7) — vitest configuration, React testing setup, jsdom environment
- `/websites/testing-library` (Context7) — React Testing Library setup with vitest, renderHook API
- `/websites/zod_dev_v4` (Context7) — Zod 4 schema validation, performance benchmarks, type inference
- `/websites/react_dev_reference_react` (Context7) — Error Boundary API, useReducer + Context patterns
- `/bvaughn/react-error-boundary` (Context7) — ErrorBoundary component, useErrorBoundary hook, resetKeys
- `/websites/v7_vite_dev` (Context7) — `?url` import for WASM, assetsInclude, static asset handling
- npm registry — Verified all version numbers and peer dependencies (2026-04-13)
- All versions verified as current via `npm view` — HIGH confidence
