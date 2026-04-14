# Technical Concerns & Risks

**Analysis Date:** 2026-04-13

## Architecture Concerns

### Prop Drilling from App.tsx
- **Issue:** `App.tsx` (271 lines) is the sole state owner. It passes 10–20 props through intermediate components like `PlanTab` and `OverviewTab` down to leaf components.
- **Files:** `frontend/src/App.tsx` (lines 176–249), `frontend/src/components/dashboard/PlanTab.tsx`, `frontend/src/components/dashboard/OverviewTab.tsx`
- **Impact:** Adding any new state or callback requires modifying multiple component interfaces. High coupling between `App.tsx` and all tab components.
- **Fix approach:** Extract related state into React Context providers (e.g., `PeopleContext`, `AssumptionsContext`, `ProjectionContext`) so leaf components can consume state directly without prop drilling.

### Monolithic State in App.tsx
- **Issue:** All application state lives in a single component — people management, assumptions, projection data, UI state (dark mode, active tab, real values toggle), and portfolio view selection. `saveToLocalStorage` manually syncs 8 separate `localStorage.setItem` calls.
- **Files:** `frontend/src/App.tsx` (lines 22–98)
- **Impact:** Difficult to understand state ownership. Any state change triggers cascading re-evaluations. The `useEffect` at line 96 fires on every state change, writing to localStorage on every render cycle.
- **Fix approach:** Use a proper state management approach — either Context+Reducer or a lightweight store. Centralize localStorage persistence into a single hook or utility.

### Unused Custom Hook: `useLocalStorage`
- **Issue:** `useLocalStorage.ts` exports two hooks (`useLocalStorage`, `useLocalStorageSimple`) but neither is used anywhere in the codebase. All localStorage interaction is done manually with `useState` + `localStorage.getItem`/`setItem` in `App.tsx` and `usePeopleManagement.ts`.
- **Files:** `frontend/src/hooks/useLocalStorage.ts` (unused), `frontend/src/App.tsx` (manual localStorage at lines 22–57, 78–94), `frontend/src/hooks/usePeopleManagement.ts` (manual localStorage at lines 39–49)
- **Impact:** Dead code. Inconsistent patterns for the same operation across the codebase.
- **Fix approach:** Either adopt `useLocalStorage`/`useLocalStorageSimple` everywhere or remove them.

### Duplicate Type Definitions
- **Issue:** `Person` and `Account` types are defined in `usePeopleManagement.ts` (lines 8–23) but are also partially duplicated in `yaml-utils.ts` (lines 12–25 as `PersonData`). The `household.ts` types file defines WASM-facing types but the frontend-facing `Person` type lives in a hook.
- **Files:** `frontend/src/hooks/usePeopleManagement.ts` (lines 8–23), `frontend/src/lib/yaml-utils.ts` (lines 12–25), `frontend/src/types/household.ts`
- **Impact:** Types can drift. Adding a field to `Person` requires updating multiple files.
- **Fix approach:** Consolidate all domain types into `frontend/src/types/` and import them from there.

## Code Quality Concerns

### Duplicated Calculation Logic in Components
- **Issue:** The "goal progress" calculation (requiredAnnualIncome, requiredPortfolio, progress, gap) is fully duplicated between `SummaryCard.tsx` and `GoalsCard.tsx`. The `calculateAdditionalAnnualSavings` function with its WASM call + JS fallback is also copy-pasted.
- **Files:** `frontend/src/components/dashboard/SummaryCard.tsx` (lines 31–62), `frontend/src/components/dashboard/GoalsCard.tsx` (lines 29–61)
- **Impact:** If the formula changes, it must be updated in two places. Risk of divergence.
- **Fix approach:** Extract into a shared utility function or custom hook (e.g., `useRetirementGoal`) that computes all derived values.

### Duplicated NumberInput Component
- **Issue:** `NumberInput` is defined as a local function in both `PersonForm.tsx` (line 7) and `AccountCard.tsx` (line 5). They have slightly different signatures and styling. The autofill CSS hack is also duplicated.
- **Files:** `frontend/src/components/dashboard/PersonForm.tsx` (lines 7–66), `frontend/src/components/dashboard/AccountCard.tsx` (lines 5–46)
- **Impact:** Bug fixes or feature additions (e.g., max validation, better number parsing) must be applied to both.
- **Fix approach:** Extract into a shared `NumberInput` component in `frontend/src/components/` with a unified API and styling.

### Duplicated formatCurrency Function
- **Issue:** `formatCurrency` is defined in `usePeopleManagement.ts` (line 3) and separately in `GrowthChart.tsx` (line 5) with different behavior — the hook version handles strings, the chart version does compact formatting ($1.2M, $150k).
- **Files:** `frontend/src/hooks/usePeopleManagement.ts` (line 3), `frontend/src/components/dashboard/GrowthChart.tsx` (line 5)
- **Impact:** Inconsistent number display across the app. The GrowthChart version lacks the string handling of the main version.
- **Fix approach:** Create a single `formatCurrency` utility with options for compact notation, and a `formatCompactCurrency` for charts.

### Repetitive toLocaleString Formatting
- **Issue:** The pattern `toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })` appears 19 times across 7 components.
- **Files:** `SummaryCard.tsx`, `GoalsCard.tsx`, `RetirementProjectionCard.tsx`, `PortfolioCard.tsx`, `IncomeBreakdownCard.tsx`, `IncomeTab.tsx`, `GrowthChart.tsx`
- **Impact:** Verbose, error-prone, and inconsistent if options diverge.
- **Fix approach:** Replace with calls to a centralized `formatCurrency` or `formatMoney` utility.

### Hardcoded Values in ProjectionsTab
- **Issue:** `ProjectionsTab.tsx` hardcodes `{7}%` growth rate and `{2.5}%` inflation in its descriptive text (lines 36–40) instead of using the actual `expectedReturn` and `inflationRate` props.
- **Files:** `frontend/src/components/dashboard/ProjectionsTab.tsx` (lines 36, 39)
- **Impact:** Displays incorrect assumptions to users when they've customized rates. Users see "7%" even if they set 5%.
- **Fix approach:** Pass `expectedReturn` and `inflationRate` as props and interpolate them into the text.

### Hardcoded Current Year in Rust Backend
- **Issue:** `calculate_yearly_projections` in Rust has `let current_year = 2025;` hardcoded.
- **Files:** `backend/src/calculations.rs` (line 85)
- **Impact:** Year labels on projections will become incorrect after 2025. This is a data correctness bug.
- **Fix approach:** Accept `current_year` as a parameter, or use JavaScript's `new Date().getFullYear()` on the frontend and pass it through.

### Inline CSS Styles for Animations
- **Issue:** Nine components use inline `style={{ animation: 'fadeInUp ...', opacity: 0 }}` for entrance animations. This is scattered across the codebase and not defined as a CSS class.
- **Files:** `GrowthChart.tsx`, `SummaryCard.tsx`, `LearnTab.tsx` (3 instances), `PortfolioCard.tsx`, `IncomeBreakdownCard.tsx`, `RetirementProjectionCard.tsx`, `GoalsCard.tsx`
- **Impact:** Hard to maintain, can't be overridden by users who prefer reduced motion, and mixes styling approaches (Tailwind classes + inline styles).
- **Fix approach:** Define animation utilities in CSS/Tailwind config, use a single CSS class. Respect `prefers-reduced-motion` media query.

### Inline CSS Autofill Hacks
- **Issue:** Both `PersonForm.tsx` (lines 41–63) and `AccountCard.tsx` (lines 32–43) embed `<style>` tags directly in JSX to override browser autofill styling. These inject global CSS (`.number-input` selectors) that could conflict.
- **Files:** `frontend/src/components/dashboard/PersonForm.tsx`, `frontend/src/components/dashboard/AccountCard.tsx`
- **Impact:** Global CSS side effects from component renders. Dark mode handling is inconsistent between the two.
- **Fix approach:** Move autofill styles to a shared CSS module or global stylesheet.

## Security Concerns

### YAML Import Without Schema Validation
- **Issue:** `importFromYAML` in `yaml-utils.ts` uses `yaml.load()` and only checks for truthy `parsed.assumptions` and `parsed.people`. There's no validation of field types, ranges, or structure. A malformed YAML file could inject arbitrary properties into state.
- **Files:** `frontend/src/lib/yaml-utils.ts` (lines 53–64)
- **Impact:** Importing a crafted YAML could set `currentAge` to a negative number, `balance` to `Infinity`, or add unexpected fields that break projections. The `as RetirementPlan` type assertion at line 55 provides no runtime safety.
- **Fix approach:** Add runtime validation (e.g., with Zod or manual checks) before accepting imported data. Validate numeric ranges, required fields, and account types.

### localStorage as Sole Persistence
- **Issue:** All user data is stored in localStorage with no backup mechanism. Clearing browser data destroys the retirement plan.
- **Files:** `frontend/src/App.tsx` (lines 78–98), `frontend/src/hooks/usePeopleManagement.ts` (lines 39–49)
- **Impact:** Data loss risk. No user account or cloud sync. localStorage has a ~5MB limit which this app is unlikely to hit but has no error handling for quota exceeded.
- **Fix approach:** Add `try/catch` around localStorage writes for quota errors. Consider IndexedDB for larger data. The YAML export/import feature partially mitigates this.

### No Input Sanitization on Numeric Fields
- **Issue:** Numeric inputs accept any value. Age can be set to 0 or negative. Retirement age can be set lower than current age (a warning is shown but it's not prevented). Contribution amounts can be set to negative values via the raw text parsing.
- **Files:** `frontend/src/components/dashboard/PersonForm.tsx`, `frontend/src/components/dashboard/AssumptionsPanel.tsx`
- **Impact:** Invalid data can produce nonsensical projections or divide-by-zero errors (e.g., `withdrawalRate` of 0 is guarded in some places but not all).
- **Fix approach:** Add validation constraints and prevent invalid states from being saved.

## Performance Concerns

### Redundant Projection Recalculations
- **Issue:** `App.tsx` computes `projectionData`, `individualProjectionData`, `currentProjectionData`, and `realProjectionData` as separate `useMemo` hooks. Each calls `calculateProjection`, which invokes the WASM module. The `realProjectionData` re-does the same calculation as `projectionData` but with `showRealValues=true`, effectively computing the same projection twice when real values are shown.
- **Files:** `frontend/src/App.tsx` (lines 120–142)
- **Impact:** WASM calculations run redundantly. For a 30-year projection, this creates multiple arrays of data points on every relevant state change.
- **Fix approach:** Compute projection once and derive nominal/real values by applying the inflation factor in a single pass, or memoize more granularly.

### WASM Not Lazy-Loaded on Route
- **Issue:** WASM initialization fires on app mount regardless of which tab is active. The user might only interact with the Plan tab initially, but the WASM module is already fetched and initialized.
- **Files:** `frontend/src/hooks/useProjection.ts` (lines 17–24)
- **Impact:** Unnecessary network request and CPU time on initial load. The WASM file is 76KB, which is small but still costs bandwidth on mobile.
- **Fix approach:** Consider deferring WASM init until a projection tab is first visited, though the current size is manageable.

### No WASM Loading State UI
- **Issue:** If WASM fails to load or is slow, the user sees no loading indicator. The `calculateProjection` function silently returns `[]` when `!wasmLoaded`.
- **Files:** `frontend/src/hooks/useProjection.ts` (line 35), `frontend/src/App.tsx`
- **Impact:** Users may see empty charts/summaries with no explanation while WASM loads or if it fails.
- **Fix approach:** Surface `wasmLoaded` state to the UI, show a loading spinner or skeleton while initializing, and an error state if initialization fails.

### Recharts Bundle Size
- **Issue:** `recharts` is the largest frontend dependency. It's imported in a single component (`GrowthChart.tsx`) but the entire library is bundled.
- **Files:** `frontend/package.json` (line 19), `frontend/src/components/dashboard/GrowthChart.tsx`
- **Impact:** Adds significant JavaScript bundle weight for a single chart. Could be lazily loaded since the Projections tab may not be the default view.
- **Fix approach:** Use `React.lazy()` to load `GrowthChart` or `ProjectionsTab` only when that tab is active.

## Maintainability Concerns

### WASM Binding Types Are All `any`
- **Issue:** The auto-generated WASM type declarations (`retirement_core.d.ts`, `retirement_core_bg.wasm.d.ts`) use `any` for all parameters and return types. The `retirement_core.d.ts` file has 9 instances of `any` type.
- **Files:** `frontend/src/lib/retirement_core.d.ts` (lines 8–10, 20, 22), `frontend/src/lib/retirement_core_bg.wasm.d.ts` (lines 5, 7), `frontend/src/lib/financial_math_wasm.d.ts`
- **Impact:** No TypeScript safety at the WASM boundary. Incorrect parameter shapes will only fail at runtime.
- **Fix approach:** Write manual type wrappers in `wasm-loader.ts` that accept strongly-typed inputs and cast internally. The `household.ts` types already exist but aren't used for WASM calls.

### Stale WASM Binding Files Committed
- **Issue:** `financial_math_wasm.d.ts` and `financial_math_wasm.js` appear to be older WASM binding files that coexist with the newer `retirement_core.*` files. Both sets are committed to the repo.
- **Files:** `frontend/src/lib/financial_math_wasm.d.ts`, `frontend/src/lib/financial_math_wasm.js`
- **Impact:** Confusion about which bindings are active. Dead code that could mislead developers.
- **Fix approach:** Remove the stale `financial_math_wasm.*` files. Verify nothing imports them.

### State Mutation Pattern via `setPeople(people.map(...))`
- **Issue:** Every state update in `usePeopleManagement.ts` creates a new array via `.map()`, even when only one person is modified. While immutable, the pattern is verbose and repeated 7 times with nearly identical structure.
- **Files:** `frontend/src/hooks/usePeopleManagement.ts` (lines 89–147)
- **Impact:** Error-prone — easy to forget the return statement in the `.map()` callback. Adding new update functions requires copy-pasting this pattern.
- **Fix approach:** Create a helper function like `updatePersonById(id, updater)` and `updateAccountInPerson(personId, accountId, updater)` to reduce boilerplate.

### No Error Boundaries
- **Issue:** The app has no React Error Boundaries. A crash in any component (e.g., WASM failure, malformed data) will crash the entire app with a white screen.
- **Files:** `frontend/src/main.tsx`, `frontend/src/App.tsx`
- **Impact:** Poor UX on error — user loses all context. No way to recover without page refresh.
- **Fix approach:** Add an Error Boundary wrapper around each tab content and around the main App shell.

### ID Generation Using `Date.now()`
- **Issue:** Person and account IDs are generated with `Date.now().toString()`. If two accounts are added within the same millisecond, they'd share an ID.
- **Files:** `frontend/src/hooks/usePeopleManagement.ts` (lines 71, 98)
- **Impact:** Potential ID collision causing data corruption (merged/duplicate accounts).
- **Fix approach:** Use `crypto.randomUUID()` or a counter-based approach.

## Dependency Risks

### No Lockstep WASM Versioning
- **Issue:** The WASM binary committed in `frontend/public/wasm/` and the JS bindings in `frontend/src/lib/` can drift from the actual Rust source in `backend/`. There's no automated check that they're in sync during development.
- **Files:** `frontend/public/wasm/retirement_core_bg.wasm`, `frontend/src/lib/retirement_core.js`, `frontend/src/lib/retirement_core.d.ts`
- **Impact:** Developers can build the frontend with stale WASM artifacts, leading to runtime errors or incorrect calculations. The CI pipeline builds WASM fresh but local development may not.
- **Fix approach:** Add a git hook or pre-build script that checks WASM freshness. Include a version hash in the WASM output to verify at runtime.

### Missing Test Dependencies
- **Issue:** `package.json` has no test runner configured. There's no `vitest`, `jest`, or testing library in dependencies. No test scripts exist.
- **Files:** `frontend/package.json`
- **Impact:** Zero frontend test coverage. CI pipeline runs type checks and lint but no tests for the frontend.
- **Fix approach:** Add `vitest` and `@testing-library/react` as dev dependencies. Configure test scripts.

## Testing Gaps

### Zero Frontend Test Coverage
- **Issue:** No test files exist in the frontend. No test runner is configured.
- **Files:** Entire `frontend/src/` directory — no `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files found.
- **Impact:** Any refactoring or feature addition risks breaking existing functionality with no automated safety net.
- **Priority:** High
- **Recommended starting points:**
  - `usePeopleManagement.ts` — pure state logic, easy to unit test
  - `yaml-utils.ts` — import/export round-trip tests
  - `wasm-loader.ts` — initialization and error handling
  - `SummaryCard.tsx` / `GoalsCard.tsx` — verify calculation correctness

### Incomplete Rust Test Coverage
- **Issue:** Backend tests only cover `calculate_additional_annual_savings`. No tests exist for `calculate_projection`, `calculate_yearly_projections`, `calculate_simple_projection`, or edge cases (e.g., zero balances, max ages, zero return rate).
- **Files:** `backend/tests/calculations_test.rs` (173 lines, 6 tests), `backend/src/calculations.rs` (204 lines, 5 functions)
- **Impact:** Core calculation functions are untested. Changes to growth formulas could introduce bugs silently.
- **Priority:** High

### No Integration Tests for WASM Bridge
- **Issue:** No tests verify that the JavaScript → WASM → JavaScript data flow works correctly. The `serde-wasm-bindgen` serialization/deserialization is untested.
- **Files:** `frontend/src/lib/wasm-loader.ts`, `backend/src/lib.rs`
- **Impact:** Type mismatches or serialization errors between JS and Rust would only be caught at runtime.
- **Priority:** Medium

## Deployment Concerns

### GitHub Pages SPA Routing
- **Issue:** The app is deployed to GitHub Pages which doesn't support server-side routing. While the app uses hash-free paths via Vite's `base` config, there's no `404.html` redirect fallback documented.
- **Files:** `frontend/vite.config.ts` (line 8), `.github/workflows/deploy.yml`
- **Impact:** Direct navigation to a specific URL may return 404 on GitHub Pages.
- **Fix approach:** Ensure a `404.html` that redirects to `index.html` exists, or use hash-based routing.

### No Cache Busting for WASM Binary
- **Issue:** The WASM binary is loaded with a static path `/wasm/retirement_core_bg.wasm`. After a deploy, browsers may serve a cached version of the old WASM binary while the new JS bindings expect a different interface.
- **Files:** `frontend/src/lib/wasm-loader.ts` (line 12), `frontend/public/wasm/`
- **Impact:** Users may see WASM deserialization errors after deploys until cache expires.
- **Fix approach:** Append a content hash to the WASM filename during build, or use Vite's asset handling to fingerprint the WASM file.

### No Version Tracking in Deployed App
- **Issue:** The app has `version: "0.0.0"` in `package.json` with no mechanism to display the running version to users or identify which commit is deployed.
- **Files:** `frontend/package.json` (line 6)
- **Impact:** Cannot verify which version users are running. Debugging user reports is harder.
- **Fix approach:** Inject `git describe` output as a build-time variable and display in the footer.

## Improvement Opportunities

### Quick Wins (Low effort, high impact)

1. **Remove stale `financial_math_wasm.*` files** — Dead code cleanup, reduces confusion. Files: `frontend/src/lib/financial_math_wasm.d.ts`, `frontend/src/lib/financial_math_wasm.js`

2. **Fix hardcoded year in Rust** — Change `let current_year = 2025;` to accept a parameter. File: `backend/src/calculations.rs` line 85

3. **Fix hardcoded rates in ProjectionsTab** — Pass actual rates as props instead of hardcoded `{7}%` and `{2.5}%`. File: `frontend/src/components/dashboard/ProjectionsTab.tsx` lines 36, 39

4. **Replace `Date.now()` IDs with `crypto.randomUUID()`** — Prevents ID collisions. File: `frontend/src/hooks/usePeopleManagement.ts` lines 71, 98

5. **Add `try/catch` around localStorage writes** — Handle quota exceeded errors. File: `frontend/src/App.tsx` lines 78–94

6. **Use `useLocalStorage` hook or remove it** — Eliminate dead code inconsistency. File: `frontend/src/hooks/useLocalStorage.ts`

### High-Impact Improvements

1. **Extract duplicated goal calculations into a shared hook** — Eliminates the most significant code duplication (SummaryCard + GoalsCard). Estimated savings: ~40 lines of duplicated logic.

2. **Add YAML import validation** — Prevent malformed data from corrupting state. Use runtime checks or Zod schemas on import.

3. **Add React Error Boundaries** — Prevent white-screen crashes. Wrap each tab in an ErrorBoundary.

4. **Add frontend test infrastructure** — Install vitest, write initial tests for hooks and utilities.

5. **Consolidate types** — Move all domain types to `frontend/src/types/`, eliminate duplication between hook files and yaml-utils.

### Refactoring Candidates

1. **`App.tsx` decomposition** — 271 lines, all state, all persistence. Break into context providers and custom hooks.

2. **`usePeopleManagement.ts` state update helpers** — 7 nearly-identical `.map()` patterns. Extract into reusable updater functions.

3. **Shared `NumberInput` component** — Two copies with different styling. Unify into a single reusable component.

4. **Animation system** — 9 inline animation styles scattered across components. Centralize into CSS utilities with `prefers-reduced-motion` support.

---

*Concerns audit: 2026-04-13*
