# Project Research Summary

**Project:** Retire, Eh? — Codebase Quality Remediation
**Domain:** React 19 + Rust/WASM SPA refactoring (Canadian retirement planning app)
**Researched:** 2026-04-13
**Confidence:** HIGH

## Executive Summary

This is a brownfield quality remediation project for a React 19 + Rust/WASM single-page retirement planning app deployed to GitHub Pages. The app works functionally but has zero tests, zero error boundaries, unvalidated data imports, duplicated logic, and a monolithic 271-line `App.tsx` that holds all state. Experts building similar financial tools prioritize correctness guarantees (runtime validation of external data, comprehensive calculation tests) and resilience (error boundaries, WASM loading states) before architectural improvements.

The recommended approach is a phased refactoring ordered by risk and dependency: start with correctness bugs and safety nets (error boundaries, validation, test infrastructure), then deduplicate shared code (types, utilities, components), then decompose state into React Context providers, and finally optimize for production (cache busting, lazy loading, accessibility). This order ensures every structural change has test coverage before it happens, and every phase is independently deployable. The critical insight is that **test infrastructure must precede all refactoring** — zero tests means zero regression safety, which makes every subsequent change a gamble.

The key risks are: (1) Context decomposition splitting localStorage writes across providers, causing race conditions on persistence — prevented by a single `usePersistence` hook; (2) WASM binding drift when Rust function signatures change — prevented by atomic commits that update Rust, bindings, and calling code together; (3) YAML import allowing state corruption via `as Type` assertions — prevented by Zod 4 runtime validation; (4) Refactoring scope creating unverifiable 10+ file changes — prevented by strict phase ordering with one structural change at a time.

## Key Findings

### Recommended Stack

The project needs 6 new dev dependencies and 2 runtime dependencies, all chosen for React 19 compatibility and minimal bundle impact. No external state management library is needed — React Context + `useReducer` handles the app's 3 state domains cleanly.

**Core technologies:**
- **Vitest 4.1.4** — Test runner with native Vite 7 integration, zero-config, Jest-compatible API
- **@testing-library/react 16.3.2** — React 19 compatible component testing, queries DOM like a user
- **Zod 4.3.6** — Runtime validation for YAML import (security-critical boundary), 6.5x faster than v3, provides type inference
- **react-error-boundary 6.1.1** — React 19 compatible error boundary wrapper, avoids writing class components
- **wasm-bindgen-test** — WASM bridge integration tests running in headless browser/Node
- **React Context + useReducer** — State management (no library needed for 3 domains, ~16 components)
- **Vite `?url` import** — WASM cache busting via content hashing in production builds

See [STACK.md](./STACK.md) for version compatibility matrix, installation commands, and configuration details.

### Expected Features

Research identified 22 quality features across 3 tiers. The app has 12 "table stakes" features whose absence causes bugs, crashes, or data corruption, and 10 "differentiators" that elevate the codebase from "not broken" to "well-engineered."

**Must have (table stakes):**
- Error boundaries around component trees — current: zero, any crash = white screen of death
- WASM loading state UI — current: silent failure, returns empty arrays
- Input validation on numeric fields — current: any value accepted including negative ages
- YAML import schema validation — current: `as RetirementPlan` assertion provides zero runtime safety
- Fix hardcoded year 2025 in Rust and hardcoded rates in ProjectionsTab — correctness bugs
- Replace `Date.now()` IDs with `crypto.randomUUID()` — current: millisecond collision risk
- localStorage error handling — current: 8 unprotected `setItem` calls
- Frontend test infrastructure — current: zero tests, zero test dependencies
- Expand Rust test coverage — current: 4 of 5 calculation functions untested
- Consolidate duplicated logic (goal calculation, NumberInput, formatCurrency, types)
- Remove stale WASM binding files and unused `useLocalStorage` hook
- WASM cache busting — current: static path, stale cached WASM after deploys

**Should have (differentiators):**
- Context + Reducer state architecture — eliminate 10-20 prop drilling
- Strongly-typed WASM boundary — replace 9 instances of `any` with typed wrappers
- Lazy-load Recharts — ~200KB+ deferred until Projections tab visited
- Reduced motion support — 9 components with inline animations ignoring `prefers-reduced-motion`
- Version tracking in deployed app, GitHub Pages SPA routing fallback, centralized formatMoney utility

**Explicitly defer (anti-features):**
- No Redux/Zustand, no E2E tests, no service worker, no Sentry, no Recharts migration, no IndexedDB, no browser-mode tests

See [FEATURES.md](./FEATURES.md) for feature dependencies, MVP recommendations, and anti-feature rationale.

### Architecture Approach

The target architecture decomposes the monolithic `App.tsx` into three layered contexts following React's official "Scaling Up with Reducer and Context" pattern. A `PeopleContext` (useReducer, 10 action types) handles people/accounts CRUD. An `AssumptionsContext` (simple useState) manages financial parameters. A `ProjectionContext` (derived, no own state) consumes both via `useMemo` to compute WASM projections. A `usePersistence` hook coordinates all localStorage writes atomically, and a `useRetirementGoal` hook replaces duplicated goal calculations in SummaryCard and GoalsCard.

**Major components:**
1. **PeopleContext** — People/accounts CRUD with `useReducer`, split state/dispatch contexts to prevent unnecessary re-renders, exports `usePeople()` + `usePeopleDispatch()` hooks
2. **AssumptionsContext** — Return rate, inflation, withdrawal rate via `useState`, exports `useAssumptions()` + `useAssumptionsUpdater()`
3. **ProjectionContext** — Derived data consuming People + Assumptions contexts, WASM computation via `useMemo`, exports `useProjectionData()`
4. **usePersistence** — Single coordinated localStorage writer reading from all contexts, atomic writes
5. **useRetirementGoal** — Extracted shared hook replacing duplicated logic in SummaryCard + GoalsCard

**Key architecture rules:**
- `types/` is the single source of truth — no types defined in hooks or components
- `lib/` has zero React imports — pure functions, fully testable in Node
- WASM-facing types (`household.ts`) stay snake_case — they match Rust serde serialization
- `activeTab` stays as local state in App.tsx — only used by parent/child, not worth a context

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component boundaries, data flow diagrams, and build order.

### Critical Pitfalls

1. **Context decomposition splits localStorage ownership** — Must create a single `usePersistence` hook that subscribes to all contexts and writes atomically. Never split persistence `useEffect` into each context provider. Map every localStorage key to exactly one owner before decomposition.
2. **Derived state crossing context boundaries** — `ProjectionContext` must be nested inside both `PeopleProvider` and `AssumptionsProvider`. Document the provider tree explicitly. Alternative: combine People + Assumptions into a single `PlanContext` to avoid cross-context dependency.
3. **WASM binding changes break committed JS artifacts** — When changing any `#[wasm_bindgen]` Rust function, update Rust → rebuild WASM → copy all 3 output files → update calling code → update type wrappers — all in one atomic commit. Add CI verification that committed bindings match built WASM.
4. **YAML import allows state corruption** — The `as RetirementPlan` assertion provides zero runtime safety. Use Zod 4 to validate all fields (types, ranges, required properties) before accepting imported data into state. Strip unknown fields.
5. **Refactoring scope creates unverifiable changes** — Never have more than one structural change in flight at a time. Establish tests for stable code before refactoring it. No PR should modify more than 10 files.
6. **localStorage has no schema versioning** — Type changes during refactoring silently break existing user data. Add `SCHEMA_VERSION` constant and migration functions BEFORE any type shape changes.
7. **Context provider initialization order causes stale reads** — `portfolioPersonId` must derive from PeopleContext, not read localStorage directly, to avoid stale data when contexts initialize in different order.

See [PITFALLS.md](./PITFALLS.md) for 10 critical, 6 moderate, and 3 minor pitfalls with prevention strategies, warning signs, and recovery costs.

## Implications for Roadmap

Based on combined research, 6 phases are recommended. The ordering is driven by: dependencies (tests before refactoring), risk (correctness bugs before architecture), and pitfall prevention (persistence strategy before context decomposition).

### Phase 1: Correctness Fixes & Safety Nets
**Rationale:** Fixes active bugs and adds crash protection — no refactoring, just fixing what's broken. These are low-risk, 1-2 file changes that should go first.
**Delivers:** Correct projections, no white-screen crashes, no data corruption from ID collisions, clean codebase without stale files.
**Addresses:** Hardcoded values (#5), UUID IDs (#6), Error boundaries (#1), WASM loading state (#2), localStorage error handling (#7), Remove stale code (#11).
**Avoids:** Pitfall 8 (scope creates unverifiable changes) — these are small, independent fixes. Pitfall 3 (WASM binding drift) — the Rust year fix is the one change that touches the WASM boundary, done atomically.
**Key warning:** The Rust hardcoded year fix (Pitfall 3) changes the WASM API surface. Must be an atomic commit: Rust change → `wasm-pack build` → copy 3 files → update calling code.

### Phase 2: Test Infrastructure & Validation
**Rationale:** Tests must exist before any structural refactoring begins. Validation prevents corrupt data from entering the system. This is the safety net for all subsequent phases.
**Delivers:** Vitest setup with React Testing Library, initial tests for critical paths (yaml-utils, usePeopleManagement, Rust calculations), input validation, Zod 4 YAML import validation.
**Uses:** Vitest 4.1.4, @testing-library/react 16.3.2, Zod 4.3.6, wasm-bindgen-test.
**Addresses:** Test infrastructure (#8), Input validation (#3), YAML import validation (#4), Expand Rust tests (#9).
**Avoids:** Pitfall 6 (tests against implementation details) — test behavior, not implementation. Pitfall 4 (YAML state corruption) — Zod validation blocks malformed imports. Pitfall 16 (`crypto.randomUUID` not in jsdom) — add polyfill to test setup.
**Key warning:** Pitfall 9 (localStorage has no schema versioning) — add `SCHEMA_VERSION` constant BEFORE any type shape changes happen in later phases. This is foundational.

### Phase 3: Shared Code Extraction
**Rationale:** Extract shared types, utilities, and components before the architecture refactor. This reduces the scope of Phase 4 (context decomposition) because shared code is already in its final location.
**Delivers:** Centralized types in `types/`, shared NumberInput component, formatMoney/formatCompactMoney utilities, animation CSS utilities with reduced-motion support, extracted goal calculation hook.
**Addresses:** Consolidate types (#10 partial), formatMoney utility (#21), Shared animation CSS (#22), Reduced motion (#16), State update helpers (#19).
**Avoids:** Pitfall 5 (type consolidation confusion) — keep WASM types (`household.ts`) as snake_case, only consolidate frontend domain types. Pitfall 11 (NumberInput behavior differences) — accept `step` as required prop, `className` for padding overrides. Pitfall 18 (formatCurrency changes number display) — create two functions: `formatMoney` (no decimals) and `formatCompactMoney` ($1.2M).
**Key warning:** Test both NumberInput usage sites render identically after extraction. Move `@keyframes fadeInUp` AND `opacity: 0` initial state together when extracting animations.

### Phase 4: Context Architecture
**Rationale:** The big structural change — decompose App.tsx into 3 context providers. Done after types are stable and shared code is extracted. This eliminates all prop drilling.
**Delivers:** PeopleContext, AssumptionsContext, ProjectionContext, usePersistence hook, useRetirementGoal hook. App.tsx shrinks from ~271 lines to ~60 lines of layout shell.
**Implements:** Context + Reducer architecture (#13), Typed WASM boundary (#14).
**Avoids:** Pitfall 1 (splits localStorage) — single `usePersistence` hook. Pitfall 2 (cross-context derived state) — ProjectionContext consumes both, provider tree documented. Pitfall 10 (context init order) — derive `portfolioPersonId` from context, not direct localStorage read. Pitfall 13 (duplicate useEffect writes) — single persistence hook. Pitfall 15 (useLocalStorage trap) — delete or properly enhance the unused hook.
**Build order within phase:** PeopleContext → AssumptionsContext → ProjectionContext → useRetirementGoal → usePersistence → slim down App.tsx. Each step is independently deployable.

### Phase 5: Testing Expansion
**Rationale:** With the new architecture in place, expand test coverage to cover context interactions, WASM bridge, and the integration points that were risky to test before.
**Delivers:** WASM bridge integration tests, context consumer tests, expanded component tests, WASM mock strategy.
**Addresses:** WASM bridge tests (#20), strongly-typed WASM boundary completion.
**Avoids:** Pitfall 19 (testing WASM hooks without real binary) — establish mock strategy that matches actual WASM output shape (snake_case fields).
**Key warning:** WASM mocks must use snake_case field names matching `serde-wasm-bindgen` output. Only `SimpleProjection` uses camelCase (has explicit `rename_all` in Rust).

### Phase 6: Production Optimization & Polish
**Rationale:** Performance and deployment improvements that don't change behavior, only how the app is delivered. These are independent improvements that can ship in any order.
**Delivers:** Lazy-loaded Recharts, WASM cache busting via Vite `?url` import, version tracking, GitHub Pages SPA routing fallback.
**Addresses:** Lazy-load Recharts (#15), WASM cache busting (#12), Version tracking (#17), SPA routing (#18).
**Avoids:** Pitfall 7 (WASM cache busting on GitHub Pages) — move WASM from `public/` to Vite's asset pipeline. Pitfall 14 (realProjectionData redundancy) — explicitly NOT optimized, flagged for future work.
**Key warning:** Also add `404.html` for SPA routing on GitHub Pages — frequently forgotten.

### Phase Ordering Rationale

- **Phase 1 first:** Independent correctness fixes with no dependencies, fixes active bugs users encounter
- **Phase 2 second:** Tests enable safe refactoring; validation blocks data corruption; must precede structural changes
- **Phase 3 third:** Shared extraction reduces Phase 4 scope; types must be stable before contexts import from them
- **Phase 4 fourth:** The big structural change — requires stable types (Phase 3) and test coverage (Phase 2)
- **Phase 5 fifth:** Test the new architecture thoroughly after it's in place
- **Phase 6 last:** Independent polish items that don't affect architecture

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4:** Complex context decomposition with localStorage coordination — the `usePersistence` hook pattern needs careful design to avoid Pitfall 1 and Pitfall 13. Consider `/gsd-research-phase` for persistence strategies.
- **Phase 5:** WASM bridge integration testing in CI — the `wasm-bindgen-test` setup with `wasm-pack test --node` may need CI configuration research.

Phases with standard patterns (skip research-phase):
- **Phase 1:** All fixes are straightforward, well-understood patterns (try/catch, crypto.randomUUID, error boundary setup)
- **Phase 2:** Vitest + React Testing Library setup is extremely well-documented; Zod schemas are straightforward
- **Phase 3:** Standard extraction patterns (shared utility, shared component, CSS utility class)
- **Phase 6:** All items have well-documented solutions (React.lazy, Vite ?url import, 404.html redirect)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry and Context7 docs. React 19 compatibility confirmed for all dependencies. Version compatibility matrix cross-checked. |
| Features | HIGH | Feature list derived from direct codebase inspection. Priorities validated against React docs, testing-library docs, and standard financial app quality patterns. Anti-features clearly scoped. |
| Architecture | HIGH | Context + useReducer pattern is the official React recommendation (react.dev). Split state/dispatch contexts documented in React docs. Provider nesting order derived from actual data flow analysis. |
| Pitfalls | HIGH | All pitfalls grounded in actual codebase inspection (specific file names and line numbers). Prevention strategies verified against React/Vitest/Vite documentation. Recovery costs estimated. |

**Overall confidence:** HIGH

### Gaps to Address

- **localStorage schema versioning:** The exact migration strategy (which fields to version, migration function signatures) needs design during Phase 2. Research confirms the pattern (version constant + migration functions) but not the specific implementation for this app's data shapes.
- **WASM mock strategy for tests:** Three viable approaches identified (generate from actual types, shared mock factory, real WASM in tests). The best choice depends on CI build pipeline constraints — decide during Phase 5 planning.
- **Context decomposition: `PlanContext` vs separate `PeopleContext` + `AssumptionsContext`:** Research recommends separate contexts but notes the alternative of combining into `PlanContext` to avoid cross-context dependency. The roadmapper should validate which approach produces simpler provider tree for this specific app.
- **`useLocalStorage` adoption decision:** The unused hook should be either adopted as the persistence layer or removed. Decision depends on whether it aligns with the `usePersistence` hook design — recommend deletion during Phase 4.
- **Lazy-loading Recharts impact:** Need to verify that lazy-loading GrowthChart doesn't cause layout shift or perceived performance regression. Measure before/after with Lighthouse during Phase 6.

## Sources

### Primary (HIGH confidence)
- React official docs (react.dev) — Context decomposition, useReducer + Context pattern, Error Boundaries, React 19 `<Context value={}>` syntax
- Vitest documentation (vitest.dev, Context7 `/vitest-dev/vitest`) — Configuration, React testing setup, jsdom environment, coverage
- Testing Library documentation (Context7 `/websites/testing-library`) — React Testing Library setup with vitest, renderHook API
- Zod 4 documentation (Context7 `/websites/zod_dev_v4`) — Schema validation, type inference, performance benchmarks
- Vite documentation (Context7 `/websites/v7_vite_dev`) — `?url` import for WASM, asset handling, fingerprinting
- react-error-boundary (Context7 `/bvaughn/react-error-boundary`) — ErrorBoundary component, useErrorBoundary hook
- Tailwind v4 docs — `@theme` block, custom animations, `motion-reduce:` variant
- serde-wasm-bindgen behavior — field names pass through as-is (verified by codebase inspection of `models.rs`, `calculations.rs`, `useProjection.ts`)
- npm registry — All version numbers and peer dependencies verified (2026-04-13)

### Secondary (MEDIUM confidence)
- Lichtblick Suite (github.com/lichtblick-suite) — Real-world split-context pattern with guard hooks
- Community patterns for `prefers-reduced-motion` — Found across Mantine, Formidable, and other production codebases

### Tertiary (contextual)
- Direct codebase analysis — App.tsx, usePeopleManagement.ts, useProjection.ts, yaml-utils.ts, wasm-loader.ts, calculations.rs, models.rs, household.ts — all inspected directly

---
*Research completed: 2026-04-13*
*Ready for roadmap: yes*
