# Requirements: Retire, Eh? — Codebase Health & Quality

**Defined:** 2026-04-13
**Core Value:** Every concern from the codebase audit is resolved — no correctness bugs, no duplicated logic, proper testing, and a clean architecture that makes future development safe and fast.

## v1 Requirements

### Correctness

- [ ] **CORR-01**: Rust `calculate_yearly_projections` accepts `current_year` as a parameter instead of hardcoding 2025
- [ ] **CORR-02**: ProjectionsTab displays actual `expectedReturn` and `inflationRate` values instead of hardcoded 7% and 2.5%
- [ ] **CORR-03**: Person and account IDs use `crypto.randomUUID()` instead of `Date.now().toString()` to prevent collisions
- [ ] **CORR-04**: All localStorage writes are wrapped in try/catch with user-facing error for quota exceeded
- [ ] **CORR-05**: Stale `financial_math_wasm.*` binding files are removed from the repository
- [ ] **CORR-06**: Unused `useLocalStorage` hook is either adopted everywhere or removed

### Error Handling

- [ ] **ERR-01**: React Error Boundary wraps each tab content section to prevent white-screen crashes
- [ ] **ERR-02**: React Error Boundary wraps the main App shell
- [ ] **ERR-03**: WASM loading state is surfaced to the UI (spinner/skeleton while loading, error message on failure)
- [ ] **ERR-04**: Error boundaries provide user-friendly fallback UI with recovery option

### Validation

- [ ] **VAL-01**: Numeric input fields enforce valid ranges (age > 0, retirement age > current age, balances >= 0, contributions >= 0, withdrawal rate > 0)
- [ ] **VAL-02**: YAML import validates data schema before accepting into state (required fields, numeric ranges, valid account types)
- [ ] **VAL-03**: Invalid inputs show inline validation messages and prevent save of invalid states

### Testing

- [ ] **TEST-01**: Frontend test infrastructure installed and configured (vitest, @testing-library/react)
- [ ] **TEST-02**: Unit tests cover usePeopleManagement hook (add/remove/update people and accounts)
- [ ] **TEST-03**: Unit tests cover yaml-utils (import/export round-trip, malformed input handling)
- [ ] **TEST-04**: Unit tests cover wasm-loader (initialization, error handling)
- [ ] **TEST-05**: Rust tests cover `calculate_projection`, `calculate_yearly_projections`, `calculate_simple_projection` functions
- [ ] **TEST-06**: Rust tests cover edge cases (zero balances, max ages, zero return rate)
- [ ] **TEST-07**: Integration tests verify JS → WASM → JS data flow (serde-wasm-bindgen boundary)

### Code Quality

- [ ] **QUAL-01**: Domain types (Person, Account, related interfaces) are consolidated into `frontend/src/types/`
- [ ] **QUAL-02**: Duplicated goal calculation logic extracted from SummaryCard + GoalsCard into shared `useRetirementGoal` hook
- [ ] **QUAL-03**: Duplicated NumberInput component unified into single shared component with consistent API
- [ ] **QUAL-04**: Duplicated formatCurrency unified into shared utility with compact notation support
- [ ] **QUAL-05**: All 19 inline `toLocaleString` calls replaced with centralized formatMoney utility
- [ ] **QUAL-06**: State update helpers (`updatePersonById`, `updateAccountInPerson`) extracted in usePeopleManagement
- [ ] **QUAL-07**: Inline animation styles replaced with CSS utility class supporting `prefers-reduced-motion`
- [ ] **QUAL-08**: Inline autofill CSS hacks moved from JSX `<style>` tags to shared stylesheet

### Architecture

- [ ] **ARCH-01**: App.tsx state decomposed into PeopleContext (people CRUD via useReducer)
- [ ] **ARCH-02**: App.tsx state decomposed into AssumptionsContext (financial assumptions)
- [ ] **ARCH-03**: App.tsx state decomposed into ProjectionContext (WASM + projection data)
- [ ] **ARCH-04**: Prop drilling eliminated — leaf components consume state directly from contexts
- [ ] **ARCH-05**: localStorage persistence consolidated into single `usePersistence` hook
- [ ] **ARCH-06**: Manual typed wrappers for WASM boundary replace `any` types with proper TypeScript types

### Performance & Deployment

- [ ] **PERF-01**: Recharts/GrowthChart lazy-loaded via React.lazy + Suspense when Projections tab is active
- [ ] **PERF-02**: WASM binary served with content hash in filename for cache busting
- [ ] **PERF-03**: App version injected at build time from git and displayed in footer
- [ ] **PERF-04**: 404.html redirect fallback added for GitHub Pages SPA routing

## v2 Requirements

(Deferred — no v2 features in this quality project)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side backend or authentication | App remains fully client-side — no backend infrastructure |
| Cloud sync or user accounts | localStorage + YAML export remains the persistence model |
| UI/UX redesign | Visual design stays the same, only structural improvements |
| New features or new calculations | Purely quality/debt work, no new capabilities |
| Migration away from Recharts | Too disruptive — addressed by lazy loading instead |
| Redux/Zustand/external state manager | React Context+Reducer is sufficient for this scale |
| E2E test suite (Playwright/Cypress) | High maintenance cost for minimal value in this app |
| Service Worker / offline support | App already works offline via localStorage + static WASM |
| Error reporting service (Sentry) | No backend, privacy implications for financial app |
| IndexedDB for persistence | localStorage is sufficient at current data scale |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORR-01 | Phase 1 | Pending |
| CORR-02 | Phase 1 | Pending |
| CORR-03 | Phase 1 | Pending |
| CORR-04 | Phase 1 | Pending |
| CORR-05 | Phase 1 | Pending |
| CORR-06 | Phase 1 | Pending |
| ERR-01 | Phase 1 | Pending |
| ERR-02 | Phase 1 | Pending |
| ERR-03 | Phase 1 | Pending |
| ERR-04 | Phase 1 | Pending |
| VAL-01 | Phase 2 | Pending |
| VAL-02 | Phase 2 | Pending |
| VAL-03 | Phase 2 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |
| TEST-03 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Pending |
| TEST-05 | Phase 2 | Pending |
| TEST-06 | Phase 2 | Pending |
| TEST-07 | Phase 5 | Pending |
| QUAL-01 | Phase 3 | Pending |
| QUAL-02 | Phase 3 | Pending |
| QUAL-03 | Phase 3 | Pending |
| QUAL-04 | Phase 3 | Pending |
| QUAL-05 | Phase 3 | Pending |
| QUAL-06 | Phase 3 | Pending |
| QUAL-07 | Phase 3 | Pending |
| QUAL-08 | Phase 3 | Pending |
| ARCH-01 | Phase 4 | Pending |
| ARCH-02 | Phase 4 | Pending |
| ARCH-03 | Phase 4 | Pending |
| ARCH-04 | Phase 4 | Pending |
| ARCH-05 | Phase 4 | Pending |
| ARCH-06 | Phase 4 | Pending |
| PERF-01 | Phase 6 | Pending |
| PERF-02 | Phase 6 | Pending |
| PERF-03 | Phase 6 | Pending |
| PERF-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after initial definition*
