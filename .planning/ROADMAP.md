# Roadmap: Retire, Eh? — Codebase Health & Quality

## Overview

A phased quality remediation project for a Canadian retirement planning SPA built with React 19 + Rust/WASM. The journey starts with fixing active bugs and adding crash protection, establishes test coverage before any structural changes, extracts duplicated code into shared utilities, decomposes monolithic state into React Context providers, expands testing to cover the new architecture, and finishes with production optimizations for deployment reliability. The ordering is strict: correctness fixes first, then tests (safety net), then shared code, then architecture, then expanded testing, then polish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Correctness Fixes & Safety Nets** - Fix active bugs, add crash protection and WASM loading feedback
- [ ] **Phase 2: Test Infrastructure & Validation** - Establish test coverage and input validation before refactoring
- [ ] **Phase 3: Shared Code Extraction** - Consolidate duplicated types, utilities, components, and CSS
- [ ] **Phase 4: Context Architecture** - Decompose App.tsx state into React Context providers
- [ ] **Phase 5: Testing Expansion** - Integration tests for WASM bridge and context interactions
- [ ] **Phase 6: Production Optimization & Polish** - Lazy loading, cache busting, version tracking, SPA routing

## Phase Details

### Phase 1: Correctness Fixes & Safety Nets
**Goal**: All known correctness bugs are fixed, the app no longer crashes to a white screen, and WASM load/failure states are visible to users
**Depends on**: Nothing (first phase)
**Requirements**: CORR-01, CORR-02, CORR-03, CORR-04, CORR-05, CORR-06, ERR-01, ERR-02, ERR-03, ERR-04
**Success Criteria** (what must be TRUE):
  1. Projection year labels reflect the actual current year (not hardcoded 2025)
  2. ProjectionsTab displays the user's actual expected return and inflation rate values (not hardcoded 7%/2.5%)
  3. Adding two people or accounts in rapid succession produces unique IDs (no collision risk)
  4. localStorage quota exceeded shows a user-facing error message instead of silently breaking persistence
  5. A WASM load failure or component render error shows a recovery UI instead of a white screen
**Plans**: 4 plans

Plans:
- [ ] 01-01: Fix hardcoded year in Rust backend and hardcoded rates in ProjectionsTab (CORR-01, CORR-02)
- [ ] 01-02: Replace Date.now() IDs with crypto.randomUUID() and wrap localStorage writes in try/catch (CORR-03, CORR-04)
- [ ] 01-03: Add React Error Boundaries around tab content and app shell with fallback UI (ERR-01, ERR-02, ERR-04)
- [ ] 01-04: Add WASM loading state UI and remove stale files (ERR-03, CORR-05, CORR-06)

### Phase 2: Test Infrastructure & Validation
**Goal**: Automated tests protect critical paths, invalid data cannot enter the system through forms or YAML import
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. `npm test` runs and passes a suite of frontend unit tests for hooks, utilities, and the WASM loader
  2. `cd backend && cargo test` covers all 5 Rust calculation functions including edge cases (zero balances, max ages, zero return rate)
  3. Negative ages, zero withdrawal rates, and other invalid numeric inputs show inline error messages and prevent save
  4. Importing a malformed YAML file shows a clear error and does not corrupt app state
  5. All numeric input fields enforce valid ranges with visible feedback to the user
**Plans**: 4 plans

Plans:
- [ ] 02-01: Install and configure vitest with @testing-library/react and crypto polyfill (TEST-01)
- [ ] 02-02: Write unit tests for usePeopleManagement hook, yaml-utils, and wasm-loader (TEST-02, TEST-03, TEST-04)
- [ ] 02-03: Expand Rust test coverage for all calculation functions and edge cases (TEST-05, TEST-06)
- [ ] 02-04: Add numeric input validation and YAML import schema validation with Zod (VAL-01, VAL-02, VAL-03)

### Phase 3: Shared Code Extraction
**Goal**: All duplicated code is consolidated into shared types, utilities, components, and CSS — no two files do the same thing
**Depends on**: Phase 2
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-06, QUAL-07, QUAL-08
**Success Criteria** (what must be TRUE):
  1. Person and Account types are imported from a single `types/` location across all files (no duplicate definitions)
  2. SummaryCard and GoalsCard render identical goal calculations using a shared `useRetirementGoal` hook
  3. NumberInput renders consistently at both usage sites with a single shared component
  4. All money formatting uses centralized `formatMoney`/`formatCompactMoney` utilities (zero inline `toLocaleString` calls)
  5. Animations respect `prefers-reduced-motion` via a CSS utility class, no inline animation styles remain
**Plans**: 4 plans

Plans:
- [ ] 03-01: Consolidate domain types into `frontend/src/types/` (QUAL-01)
- [ ] 03-02: Extract duplicated goal calculation into shared `useRetirementGoal` hook and state update helpers (QUAL-02, QUAL-06)
- [ ] 03-03: Extract shared NumberInput component and centralized formatMoney utilities (QUAL-03, QUAL-04, QUAL-05)
- [ ] 03-04: Move inline animation styles to CSS utilities with reduced-motion support and extract autofill CSS (QUAL-07, QUAL-08)

### Phase 4: Context Architecture
**Goal**: App state is decomposed into React Context providers — prop drilling eliminated, App.tsx is a clean layout shell
**Depends on**: Phase 3
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06
**Success Criteria** (what must be TRUE):
  1. Leaf components (cards, forms) access state directly via context hooks — no prop chains through intermediate components
  2. App.tsx is a layout shell with no business logic (~60 lines)
  3. WASM boundary calls use typed wrappers instead of `any` types
  4. localStorage persistence is coordinated by a single `usePersistence` hook that writes atomically
  5. All existing user functionality preserved: people CRUD, assumptions editing, real-time projection updates, YAML export/import
**Plans**: 4 plans

Plans:
- [ ] 04-01: Create PeopleContext with useReducer and PeopleReducer (ARCH-01, ARCH-04)
- [ ] 04-02: Create AssumptionsContext and ProjectionContext consuming both (ARCH-02, ARCH-03, ARCH-04)
- [ ] 04-03: Create usePersistence hook, useRetirementGoal hook, and wire providers (ARCH-04, ARCH-05)
- [ ] 04-04: Write typed WASM boundary wrappers and slim down App.tsx (ARCH-04, ARCH-06)

### Phase 5: Testing Expansion
**Goal**: Integration tests verify the WASM boundary and context architecture work correctly end-to-end
**Depends on**: Phase 4
**Requirements**: TEST-07
**Success Criteria** (what must be TRUE):
  1. Integration tests verify JS → WASM → JS data flow produces correct projection values with real WASM binary
  2. Context consumer tests confirm state updates propagate correctly through all provider layers
  3. WASM mock strategy is documented and verified against actual output shapes (snake_case fields)
**Plans**: 2 plans

Plans:
- [ ] 05-01: Write WASM bridge integration tests verifying serde-wasm-bindgen round-trip (TEST-07)
- [ ] 05-02: Write context consumer tests and establish WASM mock strategy

### Phase 6: Production Optimization & Polish
**Goal**: App loads faster, deploys reliably with cache busting, and is observable in production
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Recharts is not in the initial bundle — loaded lazily only when the Projections tab is visited
  2. WASM binary filename includes a content hash, preventing stale cache after deploys
  3. App version displayed in footer matches the deployed git commit
  4. Direct URL navigation on GitHub Pages loads the app correctly (404.html redirect fallback works)
**Plans**: 3 plans

Plans:
- [ ] 06-01: Lazy-load Recharts/GrowthChart via React.lazy + Suspense (PERF-01)
- [ ] 06-02: Add WASM cache busting with content hash and version tracking (PERF-02, PERF-03)
- [ ] 06-03: Add 404.html redirect fallback for GitHub Pages SPA routing (PERF-04)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Correctness Fixes & Safety Nets | 4/4 | ✅ Done | 2026-04-14 |
| 2. Test Infrastructure & Validation | 4/4 | ✅ Done | 2026-04-14 |
| 3. Shared Code Extraction | 4/4 | ✅ Done | 2026-04-14 |
| 4. Context Architecture | 4/4 | ✅ Done | 2026-04-14 |
| 5. Testing Expansion | 2/2 | ✅ Done | 2026-04-14 |
| 6. Production Optimization & Polish | 0/3 | Not started | - |
