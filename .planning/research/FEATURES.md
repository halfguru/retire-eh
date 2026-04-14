# Feature Landscape: Production Quality for React + WASM Apps

**Domain:** Codebase quality remediation for a brownfield React 19 + Rust/WASM SPA
**Researched:** 2026-04-13
**Focus:** What quality features a production React + WASM app must have vs nice-to-have

## Table Stakes

Features users experience directly (or their absence causes bugs/crashes). Missing = product feels broken.

### 1. Error Boundaries Around Component Trees

| Aspect | Detail |
|--------|--------|
| **Why Expected** | React apps without error boundaries crash to white screen on any render error. WASM failures, malformed imported data, or calculation errors will take down the entire app. |
| **Complexity** | Low |
| **Notes** | Wrap each tab content + app shell in error boundaries. React 19 still requires class components for error boundaries, or use `react-error-boundary` library. The app has 5 tabs — each is an isolation boundary. Also wrap the WASM-dependent components (GrowthChart, projection cards) separately. |

**Pattern (from React docs, HIGH confidence):**
```tsx
// React 19 error boundary — class component required
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, info) { console.error(error, info.componentStack); }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

**Current state:** Zero error boundaries. Any crash = white screen of death.

### 2. WASM Loading State UI

| Aspect | Detail |
|--------|--------|
| **Why Expected** | WASM is async. Users see empty charts/summaries with zero explanation during load or on failure. Silent `return []` on `!wasmLoaded` hides the problem. |
| **Complexity** | Low |
| **Notes** | Surface `wasmLoaded` + error state from `useProjection` hook. Show skeleton/spinner while loading, clear error message on failure. WASM is only 76KB so loading is fast, but it can still fail (network error, incompatible browser). |

**Current state:** Silent failure — `calculateProjection` returns `[]` when WASM not loaded. No error state tracked.

### 3. Input Validation on Numeric Fields

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Users can enter negative ages, set retirement age < current age, or set `withdrawalRate` to 0 — all producing nonsensical projections or divide-by-zero errors. |
| **Complexity** | Medium |
| **Notes** | Validate: age > 0, retirement age > current age, withdrawal rate > 0, balances >= 0, contributions >= 0. Show inline validation messages. Block save of invalid states. |

**Current state:** Zero validation. Any numeric value accepted.

### 4. YAML Import Schema Validation

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Importing a crafted YAML can inject `Infinity`, negative ages, or arbitrary properties into state. The `as RetirementPlan` assertion provides zero runtime safety. This is the app's only data ingress point besides manual form input. |
| **Complexity** | Medium |
| **Notes** | Validate: required fields exist, numeric ranges are valid, account types are 'RRSP' or 'TFSA', people array is non-empty. Can use manual runtime checks (PROJECT.md decided against Zod for ~5 validation rules). Validate before accepting imported data into state. |

**Current state:** Only checks `parsed.assumptions` and `parsed.people` are truthy. No type/range validation.

### 5. Fix Hardcoded Values (Correctness Bugs)

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Hardcoded year 2025 in Rust makes projection labels wrong after 2025. Hardcoded 7%/2.5% rates in ProjectionsTab display wrong assumptions to users who customized rates. These are data correctness bugs. |
| **Complexity** | Low |
| **Notes** | Two separate fixes: (1) Rust: accept `current_year` as parameter, (2) ProjectionsTab: use actual `expectedReturn`/`inflationRate` props. Both are small, targeted changes. |

**Current state:** Both hardcoded values are live bugs.

### 6. Replace Date.now() IDs with crypto.randomUUID()

| Aspect | Detail |
|--------|--------|
| **Why Expected** | `Date.now().toString()` can produce duplicate IDs when two accounts/people are added in the same millisecond. ID collision causes data corruption (merged/duplicate entries). |
| **Complexity** | Low |
| **Notes** | `crypto.randomUUID()` is available in all modern browsers and generates collision-proof UUIDs. Change 2 locations in `usePeopleManagement.ts`. |

**Current state:** `Date.now().toString()` at lines 71 and 98.

### 7. localStorage Error Handling

| Aspect | Detail |
|--------|--------|
| **Why Expected** | localStorage writes can fail (quota exceeded in private browsing, storage full). Current code has 8 `localStorage.setItem` calls with zero error handling. A single failure silently breaks persistence. |
| **Complexity** | Low |
| **Notes** | Wrap localStorage writes in try/catch. Show user-facing error if quota exceeded. Consider consolidating 8 separate `setItem` calls into one JSON blob for efficiency and atomic writes. |

**Current state:** No error handling on any localStorage write.

### 8. Frontend Test Infrastructure

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Zero test coverage means any refactoring (including all the work in this project) risks breaking existing functionality with no automated safety net. A codebase quality project without tests is self-defeating. |
| **Complexity** | Medium (setup + initial tests) |
| **Notes** | Use vitest (decided in PROJECT.md) — native Vite integration, zero-config. Start with: `usePeopleManagement` (pure state logic), `yaml-utils` (import/export round-trips), `wasm-loader` (init/error handling). These are the most critical hooks/utilities and easiest to test. |

**Recommended setup (HIGH confidence, from Vitest docs):**
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { /* config */ },
})
```

**Current state:** No test runner. No test dependencies in package.json. Zero test files.

### 9. Expand Rust Test Coverage

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Only 1 of 5 calculation functions has tests. Core financial calculations are the app's value proposition — incorrect projections defeat the purpose. |
| **Complexity** | Medium |
| **Notes** | Add tests for: `calculate_projection`, `calculate_yearly_projections`, `calculate_simple_projection`. Include edge cases: zero balances, max ages, zero return rate, negative values. |

**Current state:** 6 tests for `calculate_additional_annual_savings` only. 4 functions untested.

### 10. Consolidate Duplicated Logic

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Duplicated code means bug fixes must be applied in multiple places, and the copies can diverge. The goal calculation is duplicated between SummaryCard + GoalsCard — a formula change requires updating both. |
| **Complexity** | Medium |
| **Notes** | Highest priority duplications to extract: (1) Goal calculation logic → shared hook `useRetirementGoal`, (2) NumberInput → shared component, (3) formatCurrency → shared utility with compact notation, (4) Domain types → `frontend/src/types/`. |

**Current state:** Goal calculation duplicated (~40 lines), NumberInput duplicated (2 copies), formatCurrency duplicated (2 versions with different behavior), types duplicated across 3 files.

### 11. Remove Stale/Dead Code

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Stale WASM binding files (`financial_math_wasm.*`) confuse developers. Unused hooks (`useLocalStorage`) create inconsistency. Dead code increases cognitive load and maintenance burden. |
| **Complexity** | Low |
| **Notes** | Remove: `financial_math_wasm.d.ts`, `financial_math_wasm.js`. Adopt or remove `useLocalStorage.ts`. Verify nothing imports the stale files first. |

**Current state:** Two sets of WASM bindings coexist. `useLocalStorage` hook is unused.

### 12. WASM Cache Busting

| Aspect | Detail |
|--------|--------|
| **Why Expected** | After deploy, browsers may serve stale cached WASM while new JS bindings expect a different interface. This causes deserialization errors until cache expires. Users see WASM errors after deploys. |
| **Complexity** | Medium |
| **Notes** | Options: (1) Content hash in WASM filename during build, (2) Vite's `?url` import to get hashed path, (3) Append version query param. Vite already hashes JS/CSS assets — WASM in `public/` bypasses this. Move WASM through Vite's asset pipeline or add a build step to rename with hash. |

**Current state:** Static path `/wasm/retirement_core_bg.wasm` — no cache busting.

## Differentiators

Quality improvements that elevate the codebase beyond "not broken" to "well-engineered." Not expected by users, but valuable for maintainability and developer confidence.

### 13. Context + Reducer State Architecture

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Eliminates 10-20 prop drilling through intermediate components. Makes state ownership explicit. Enables leaf components to consume only the state they need. |
| **Complexity** | High |
| **Notes** | Extract into 3 contexts: `PeopleContext` (people state + CRUD), `AssumptionsContext` (financial assumptions), `ProjectionContext` (WASM + projection data). Use `useReducer` for complex state (people management). Separate state and dispatch contexts to avoid unnecessary re-renders. This is the official React-recommended pattern for scaling state. |

**Pattern (from React docs, HIGH confidence):**
```ts
// Separate state + dispatch contexts for performance
const PeopleContext = createContext<Person[] | null>(null)
const PeopleDispatchContext = createContext<Dispatch<Action> | null>(null)

function PeopleProvider({ children }) {
  const [people, dispatch] = useReducer(peopleReducer, initialPeople)
  return (
    <PeopleContext value={people}>
      <PeopleDispatchContext value={dispatch}>
        {children}
      </PeopleDispatchContext>
    </PeopleContext>
  )
}
```

**Current state:** 271-line App.tsx with all state. 10-20 props passed through tab intermediaries.

### 14. Strongly-Typed WASM Boundary

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Auto-generated WASM types are all `any`. Manual typed wrappers catch shape mismatches at compile time instead of runtime WASM crashes. |
| **Complexity** | Medium |
| **Notes** | Write typed wrapper functions in `wasm-loader.ts` that accept the existing `household.ts` types and cast internally. This is a thin adapter layer — no behavior change, just type safety. |

**Current state:** 9 instances of `any` type in WASM declarations. `household.ts` types exist but aren't used for WASM calls.

### 15. Lazy-Load Recharts / GrowthChart

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Recharts is the largest frontend dependency. Lazy-loading it defers ~200KB+ until the user actually visits the Projections tab. Faster initial page load. |
| **Complexity** | Low |
| **Notes** | Use `React.lazy()` for GrowthChart or ProjectionsTab. Wrap in `<Suspense>`. The app already has a tab architecture — only load chart code when projections tab is active. |

**Current state:** Recharts bundled unconditionally in main chunk.

### 16. Accessibility: Reduced Motion Support

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | 9 components use inline animation styles that ignore `prefers-reduced-motion`. Users with vestibular disorders get unwanted animations. Also: moving inline styles to CSS classes enables Tailwind's built-in `motion-reduce:` variant. |
| **Complexity** | Low |
| **Notes** | Define animation as CSS utility class with `@media (prefers-reduced-motion: reduce) { animation: none; opacity: 1; }`. Replace all 9 inline `style={{ animation: 'fadeInUp' }}` with the CSS class. Standard pattern: `useReducedMotion()` hook or CSS-only approach. |

**Current state:** 9 components with inline animation styles, no reduced-motion support.

### 17. Version Tracking in Deployed App

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Cannot verify which version users are running. Debugging user reports requires knowing the deployed commit. |
| **Complexity** | Low |
| **Notes** | Inject `git describe --tags` as `define` in Vite config. Display in Footer component. Enables "what version are you on?" debugging. |

**Current state:** `version: "0.0.0"` in package.json. No build-time version injection.

### 18. GitHub Pages SPA Routing Fallback

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Direct URL navigation may return 404 on GitHub Pages. Currently the app uses hash-free paths — without a 404.html redirect, deep links break. |
| **Complexity** | Low |
| **Notes** | Add `404.html` that redirects to `index.html` with the same path. This is the standard GitHub Pages SPA workaround. Single file, no ongoing maintenance. |

**Current state:** No `404.html` documented or present.

### 19. State Update Helper Extraction

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | 7 nearly-identical `.map()` patterns in `usePeopleManagement` are verbose and error-prone. Helper functions reduce boilerplate and make the update pattern explicit. |
| **Complexity** | Low |
| **Notes** | Create `updatePersonById(id, updater)` and `updateAccountInPerson(personId, accountId, updater)`. These encapsulate the immutable update pattern and reduce the 7 map calls to simple function invocations. |

**Current state:** 7 copy-pasted `.map()` patterns.

### 20. WASM Bridge Integration Tests

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | No tests verify the JS → WASM → JS data flow. `serde-wasm-bindgen` serialization is untested. Type mismatches between JS and Rust only surface at runtime. |
| **Complexity** | Medium |
| **Notes** | Test the full pipeline: construct typed inputs in JS, call WASM, verify output shape and values. Can run in vitest with WASM initialization. Validates that the serde-wasm-bindgen boundary works correctly. |

### 21. Centralized formatMoney Utility

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | 19 inline `toLocaleString` calls across 7 components with potentially diverging options. A centralized utility ensures consistency and reduces verbosity. |
| **Complexity** | Low |
| **Notes** | Create `formatMoney(value, options?)` with `compact` mode for charts ($1.2M, $150K). Replace all inline `toLocaleString` calls. This is both deduplication and standardization. |

**Current state:** 19 inline formatting calls with different options.

### 22. Shared Animation CSS Utilities

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Move inline animation CSS + autofill hacks from JSX to proper CSS. Reduces component complexity, enables `prefers-reduced-motion`, eliminates global CSS side effects from component renders. |
| **Complexity** | Low |
| **Notes** | Two parts: (1) fadeInUp animation as CSS utility class with reduced-motion support, (2) autofill CSS hacks moved to global stylesheet. Both are simple CSS extraction from JSX. |

**Current state:** Inline `<style>` tags in components inject global CSS. Inline animation styles scattered across 9 components.

## Anti-Features

Features to explicitly NOT build. These are tempting but wrong for this project.

### ~~Anti-Feature 1: Zod/Valibot for YAML Validation~~ → USE ZOD 4

> **Updated:** STACK.md research overrides the original "manual validation" decision from PROJECT.md. Zod 4 is recommended for YAML import validation.

| Updated Decision | Rationale |
|-----------------|-----------|
| **Use Zod 4** for YAML import validation (see STACK.md Section 4). The YAML import path is security-critical with 20+ fields across nested objects. Manual validation is error-prone for this complexity. Zod 4 provides type inference (DRY), clear error messages, and is 6.5x faster than v3. Bundle cost (~13KB gzipped) is negligible alongside 76KB WASM + Recharts. | For simple form input validation (ranges, negative values): manual validation is still fine. Don't use Zod for every `<input>` — use it only for the YAML import security boundary. |

### Anti-Feature 2: Redux / Zustand / External State Manager

| Why Avoid | What to Do Instead |
|-----------|-------------------|
| The app's state is moderate complexity — people management, assumptions, projection data. React Context + useReducer handles this cleanly. External state managers add dependency, learning curve, and boilerplate that's unnecessary for this scale. The React docs explicitly recommend Context+Reducer for this level of complexity. | Use React Context + useReducer. Create 3 contexts (People, Assumptions, Projection). This is native, zero-dependency, and the officially recommended pattern. |

### Anti-Feature 3: E2E Test Suite (Playwright/Cypress)

| Why Avoid | What to Do Instead |
|-----------|-------------------|
| This is a quality remediation project, not a feature project. E2E tests are high-maintenance, slow, and require significant infrastructure setup (CI browser runners, test servers). The app has no routing, no auth, no network requests — the value proposition of E2E is minimal. | Focus on unit tests (hooks, utilities) and integration tests (WASM bridge). These cover the actual risk areas and run fast. Add E2E only if the app gains routing or complex user flows in a future project. |

### Anti-Feature 4: Service Worker / Offline Support

| Why Avoid | What to Do Instead |
|-----------|-------------------|
| The app already works offline (WASM + localStorage). Adding a service worker for caching is solving a problem that doesn't exist — and introduces cache invalidation complexity, update delivery issues, and testing burden. | Keep the current approach: static assets from GitHub Pages (already CDN-cached), WASM loaded once, data in localStorage. If offline becomes a concern later, add a simple service worker, but not in this quality project. |

### Anti-Feature 5: Error Reporting Service (Sentry, etc.)

| Why Avoid | What to Do Instead |
|-----------|-------------------|
| The app is client-side only with no backend to receive error reports. Adding Sentry or similar creates a third-party dependency and privacy implications for a financial planning app. The scale (likely <1000 users) doesn't justify the integration complexity. | Use React Error Boundaries with `console.error` logging. Add a visible error UI that lets users report issues via GitHub. If the app scales significantly, reconsider. |

### Anti-Feature 6: Migration Away from Recharts

| Why Avoid | What to Do Instead |
|-----------|-------------------|
| Recharts is already integrated and working. The PROJECT.md explicitly scopes this out: "too disruptive for the scope of this project." The chart library is not the problem — bundle size is addressed by lazy loading. | Lazy-load Recharts via `React.lazy()` when the Projections tab is active. This addresses the performance concern without the risk of a library migration. |

### Anti-Feature 7: IndexedDB for Persistence

| Why Avoid | What to Do Instead |
|-----------|-------------------|
| The app stores a few KB of data. localStorage's ~5MB limit is nowhere near being hit. IndexedDB adds significant complexity (async API, cursor iteration, schema versioning) for zero user benefit at this scale. | Keep localStorage with proper error handling (try/catch for quota exceeded). The YAML export/import feature already provides a backup mechanism. |

### Anti-Feature 8: Browser-Mode / Full Component Rendering Tests

| Why Avoid | What to Do Instead |
|-----------|-------------------|
| Vitest browser mode (Playwright-based) is heavier, slower, and more complex to set up than unit testing with jsdom. For a quality remediation project focused on hooks and utilities, the value of full browser rendering is low. The test infrastructure should be easy to set up and fast to run. | Use vitest with `@testing-library/react` for component tests, and plain vitest for hooks/utilities. Browser mode can be adopted later if interaction-heavy testing is needed. |

## Feature Dependencies

```
Feature 8 (Test Infrastructure) → Feature 9 (Rust Tests are independent)
Feature 8 (Test Infrastructure) → Feature 20 (WASM Bridge Tests need test runner)
Feature 8 (Test Infrastructure) → All refactoring (tests enable safe refactoring)

Feature 10 (Consolidate Types) → Feature 14 (Typed WASM Boundary needs centralized types)
Feature 10 (Consolidate Types) → Feature 4 (YAML Validation needs centralized types)

Feature 13 (Context Architecture) → Feature 19 (State Helpers integrate with context/reducer)
Feature 13 (Context Architecture) → Feature 10 (Consolidation is easier after architecture refactor)

Feature 1 (Error Boundaries) → Feature 2 (WASM Loading State shows error in boundary)
Feature 3 (Input Validation) → Feature 4 (YAML Validation is a form of input validation)

Feature 12 (WASM Cache Busting) → Feature 17 (Version Tracking pairs with cache busting)

Feature 6 (UUID IDs) → Must happen before or with Feature 13 (Context refactor)
Feature 7 (localStorage Error Handling) → Must happen before or with Feature 13 (Context refactor)

Feature 5 (Fix Hardcoded Values) → Independent, can happen anytime
Feature 11 (Remove Dead Code) → Independent, can happen anytime
Feature 15 (Lazy Load Recharts) → Independent, can happen anytime
Feature 16 (Reduced Motion) → Feature 22 (Shared Animation CSS)
Feature 18 (SPA Routing) → Independent, can happen anytime
Feature 21 (formatMoney Utility) → Feature 10 (Consolidation includes this)
```

## MVP Recommendation

**Phase 1 — Correctness & Safety (must-do first):**
1. Fix hardcoded values (#5) — correctness bugs
2. Replace Date.now() IDs (#6) — data integrity
3. Add error boundaries (#1) — crash protection
4. Add WASM loading state (#2) — UX during load
5. Add localStorage error handling (#7) — persistence safety
6. Remove stale code (#11) — reduce confusion

**Phase 2 — Validation & Testing (safety net for refactoring):**
1. Input validation (#3) — prevent invalid data
2. YAML import validation (#4) — secure data ingress
3. Frontend test infrastructure + initial tests (#8) — enable safe refactoring
4. Expand Rust tests (#9) — calculation correctness

**Phase 3 — Code Quality (deduplication & standardization):**
1. Consolidate types (#10 partial) — foundation for other work
2. Extract shared utilities (#21, #22) — reduce duplication
3. Extract shared components (#10 partial — NumberInput, goal calc)
4. State update helpers (#19) — reduce boilerplate

**Phase 4 — Architecture (structural improvement):**
1. Context + Reducer architecture (#13) — eliminate prop drilling
2. Typed WASM boundary (#14) — type safety at boundary
3. WASM bridge tests (#20) — integration coverage

**Phase 5 — Performance & Polish:**
1. Lazy-load Recharts (#15) — bundle optimization
2. Reduced motion support (#16) — accessibility
3. WASM cache busting (#12) — deployment reliability
4. Version tracking (#17) — deployment observability
5. SPA routing fallback (#18) — GitHub Pages compatibility

## Sources

- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary (HIGH confidence)
- React Context + Reducer pattern: https://react.dev/learn/scaling-up-with-reducer-and-context (HIGH confidence)
- Vitest setup and configuration: https://vitest.dev/guide/ (HIGH confidence)
- `crypto.randomUUID()` browser support: MDN Web Docs, available in all modern browsers (HIGH confidence)
- `prefers-reduced-motion` patterns: Found across multiple production codebases (Mantine, Formidable, etc.) — standard pattern via `matchMedia` (HIGH confidence)
- WASM cache busting strategies: Vite's asset pipeline handles JS/CSS hashing; WASM in `public/` requires custom handling (MEDIUM confidence — project-specific)
- `react-error-boundary` library: Community standard, lightweight wrapper (MEDIUM confidence — not official React)
