# Retire, Eh? — Codebase Health & Quality

## What This Is

A comprehensive technical debt remediation and quality improvement project for Retire, Eh? — a Canadian retirement planning SPA built with React 19 + TypeScript and a Rust/WASM calculation engine. This project addresses all identified concerns across correctness, code quality, architecture, security, performance, testing, and deployment to bring the codebase to production-ready standards.

## Core Value

Every concern from the codebase audit is resolved — no correctness bugs, no duplicated logic, proper testing, and a clean architecture that makes future development safe and fast.

## Requirements

### Validated

- ✓ Canadian retirement planning SPA with React + WASM architecture — existing
- ✓ Multi-person household planning with multiple account types — existing
- ✓ Real-time projection calculations via Rust/WASM core — existing
- ✓ localStorage persistence with YAML export/import — existing
- ✓ Dark mode, responsive design, tab-based navigation — existing
- ✓ GitHub Pages deployment via CI/CD — existing

### Active

- [ ] Fix hardcoded 2025 year in Rust backend — accept current_year as parameter
- [ ] Fix hardcoded 7%/2.5% rates in ProjectionsTab — use actual assumption values
- [ ] Replace Date.now() IDs with crypto.randomUUID() to prevent collisions
- [ ] Add try/catch around localStorage writes for quota exceeded handling
- [ ] Remove stale financial_math_wasm.* binding files
- [ ] Remove or adopt unused useLocalStorage hook
- [ ] Extract duplicated goal calculation logic from SummaryCard + GoalsCard into shared hook
- [ ] Extract duplicated NumberInput component into shared component
- [ ] Extract duplicated formatCurrency into shared utility with compact notation support
- [ ] Replace 19 inline toLocaleString calls with centralized formatMoney utility
- [ ] Consolidate domain types (Person, Account) into frontend/src/types/
- [ ] Move inline animation styles to CSS utilities with prefers-reduced-motion support
- [ ] Move inline autofill CSS hacks to shared stylesheet
- [ ] Add YAML import schema validation (runtime checks on import)
- [ ] Add numeric input validation (ranges, negative values)
- [ ] Add React Error Boundaries around tab content and app shell
- [ ] Add WASM loading state UI (spinner/skeleton while loading, error state on failure)
- [ ] Lazy-load Recharts/GrowthChart via React.lazy
- [ ] Write manual type wrappers for WASM boundary (replace any types)
- [ ] Extract state update helpers in usePeopleManagement (updatePersonById, updateAccountInPerson)
- [ ] Decompose App.tsx state into context providers (People, Assumptions, Projection)
- [ ] Add WASM cache busting with content hash in filename
- [ ] Add version tracking in deployed app (git describe at build time)
- [ ] Add frontend test infrastructure (vitest, @testing-library/react)
- [ ] Write unit tests for usePeopleManagement hook
- [ ] Write unit tests for yaml-utils (import/export round-trips)
- [ ] Write unit tests for wasm-loader (init and error handling)
- [ ] Expand Rust test coverage for calculate_projection, calculate_yearly_projections, calculate_simple_projection
- [ ] Add WASM bridge integration tests (JS→WASM→JS data flow)
- [ ] Ensure 404.html redirect fallback exists for GitHub Pages SPA routing

### Out of Scope

- Server-side backend or authentication — app remains fully client-side
- Cloud sync or user accounts — localStorage + YAML export remains the persistence model
- UI/UX redesign — visual design stays the same, only structural improvements
- New features or new calculation capabilities — this is purely quality/debt work
- Migration away from Recharts — too disruptive for the scope of this project

## Context

**Current codebase state:**
- Brownfield React 19 + TypeScript 5.9 + Tailwind v4 frontend
- Rust 2021 Edition core compiled to WASM via wasm-pack
- 16 dashboard components, 4 custom hooks, all state centralized in App.tsx (271 lines)
- Zero frontend tests, partial Rust test coverage (1 of 5 calculation functions)
- Deployed to GitHub Pages via CI/CD with 3 workflows (CI, deploy, release)
- Full codebase map available at `.planning/codebase/`

**Key technical debt areas:**
- Correctness: hardcoded year (2025), hardcoded rates (7%, 2.5%), ID collision risk
- Duplication: goal calculations, NumberInput component, formatCurrency, types
- Architecture: 271-line App.tsx with all state, prop drilling through 3+ layers
- Security: unvalidated YAML import, no input sanitization
- Testing: zero frontend tests, incomplete Rust tests, no WASM bridge tests
- Deployment: no WASM cache busting, stale binding files, no version display

## Constraints

- **Tech Stack**: Keep React 19 + Vite 7 + Tailwind v4 + Rust/WASM — no framework changes
- **Backwards Compatibility**: Existing user data in localStorage must remain valid after refactoring
- **CI/CD**: All existing GitHub Actions workflows must continue to pass
- **No Downtime**: Deployment is static — changes ship atomically via CI
- **File Sizes**: WASM binary must remain under 1MB (currently ~76KB)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Context providers over Redux/Zustand | Lightweight, native React, sufficient for this app's state complexity | — Pending |
| vitest over jest | Native Vite integration, faster, zero-config with Vite | — Pending |
| Runtime validation (manual) over Zod | Avoid adding dependency for ~5 validation checks on YAML import | — Pending |
| CSS utilities over animation library | App only uses fadeInUp — not worth a dependency | — Pending |
| Keep Recharts | Only chart library, lazy-load to address bundle size | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-13 after initialization*
