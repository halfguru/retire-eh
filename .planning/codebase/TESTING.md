# Testing Strategy

**Analysis Date:** 2026-04-13

## Test Framework

### Frontend

- **No test framework configured** — no Jest, Vitest, or testing-library setup
- No test runner in `package.json` scripts (the `npm test` reference in AGENTS.md does not correspond to an actual script)
- No test configuration files found (no `vitest.config.*`, `jest.config.*`, or `setupTests.*`)
- No test files found (`*.test.*` or `*.spec.*`)

### Backend (Rust)

- **Built-in Rust test framework** via `cargo test`
- Integration tests in `backend/tests/` directory
- No additional test dependencies in `Cargo.toml` (no `#[cfg(test)]` dev-dependencies)

## Test Organization

### Backend Test Structure

```
backend/
├── src/
│   ├── lib.rs           # No inline tests
│   ├── calculations.rs  # No inline tests (pure functions)
│   └── models.rs        # No inline tests
└── tests/
    └── calculations_test.rs  # Integration tests
```

- **Integration tests only** — tests live in `backend/tests/` and exercise the public API
- **No unit tests** inside `src/` files (no `#[cfg(test)] mod tests` blocks)
- Tests import from the crate's public API: `use retirement_core::calculations::calculate_additional_annual_savings`

### Test File Naming

- Pattern: `tests/{module}_test.rs` — e.g., `calculations_test.rs`

## Frontend Tests

### Current State

**No frontend tests exist.** The project has zero test coverage for:
- React components
- Custom hooks
- Utility functions (`yaml-utils.ts`, `wasm-loader.ts`)
- WASM integration layer

### If Frontend Tests Are Added

Recommended setup based on the project's Vite + React stack:

```bash
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Add to package.json scripts
"test": "vitest run"
"test:watch": "vitest"
"test:coverage": "vitest run --coverage"
```

Recommended `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

## Backend/Rust Tests

### Test Structure Pattern

```rust
use retirement_core::calculations::calculate_additional_annual_savings;

#[test]
fn test_additional_annual_savings_no_gap() {
    let current: f64 = 1000000.0;
    let target: f64 = 900000.0;
    let years = 27;
    let result = calculate_additional_annual_savings(current, target, years, 7.0, 2.5, 0.0);
    assert_eq!(result, 0.0);
}
```

### Key Test Patterns

**Edge case tests:**
- Zero years → returns 0.0
- Already at/above target → returns 0.0
- These guard against division-by-zero and infinite loops

**Property-based verification:**
- Calculate the additional savings amount, then **simulate** the full projection to verify the result reaches the target within tolerance

```rust
#[test]
fn test_additional_annual_savings_simple_case() {
    let additional = calculate_additional_annual_savings(
        current, target, years, return_rate, inflation, current_contributions,
    );

    // Verify by simulation
    let mut balance = current;
    for _ in 0..months {
        balance = balance * (1.0 + monthly_rate) + monthly_contribution;
    }
    let final_value = balance / inflation_factor;

    // Should be within $100 of target
    assert!(diff.abs() < 100.0, "Final value {} is more than $100 from target {}", ...);
}
```

**Comparison tests:**
- Test that having existing contributions reduces additional needed

```rust
assert!(
    additional < additional_zero,
    "Additional savings with existing contributions {} should be less than without {}",
    additional, additional_zero
);
```

### Coverage Areas

**Tested:**
- `calculate_additional_annual_savings` — 6 test cases covering edge cases, simple/complex scenarios, exact match, and user scenario

**Not tested:**
- `calculate_projection` — main single-projection calculation
- `calculate_yearly_projections` — multi-year projection with per-account tracking
- `calculate_simple_projection` — simplified projection
- `calculate_future_value` — compound interest formula
- `calculate_safe_withdrawal` — 4% rule calculation
- `models.rs` — serialization/deserialization of WASM-bound structs
- `lib.rs` — WASM bridge layer and error handling

### Run Commands

```bash
# From project root
cd backend && cargo test                # Run all tests
cd backend && cargo test test_name      # Run single test
cd backend && cargo test -- --nocapture # Show println! output
```

## CI Testing

### CI Pipeline (`.github/workflows/ci.yml`)

**Frontend checks (runs on push/PR to main/develop):**
1. `npm ci` — install dependencies
2. `npm run typecheck` — TypeScript type checking (`tsc -b`)
3. `npm run lint` — ESLint
4. `npm run build` — Production build

**Backend checks (runs on push/PR to main/develop):**
1. `cargo test` — Run Rust tests
2. `cargo clippy -- -D warnings` — Lint (warnings as errors)
3. `cargo fmt -- --check` — Format check
4. `wasm-pack build --target web` — Verify WASM builds

### Quality Gates

| Gate | Frontend | Backend |
|------|----------|---------|
| Type checking | `tsc -b` (strict mode) | N/A |
| Linting | ESLint (recommended rules) | Clippy (`-D warnings`) |
| Formatting | Not enforced | `cargo fmt --check` |
| Tests | None | `cargo test` |
| Build | `vite build` | `wasm-pack build` |

### Deploy Pipeline (`.github/workflows/deploy.yml`)

- Runs on push to `main`
- Builds WASM + frontend + deploys to GitHub Pages
- **No test step in deploy pipeline** — relies on CI pipeline having passed on the PR

## Test Coverage Gaps

### Critical Untested Areas

| Area | Risk | Priority |
|------|------|----------|
| `calculate_yearly_projections` (Rust) | Core projection logic — financial accuracy | **High** |
| `calculate_projection` (Rust) | Summary projection — financial accuracy | **High** |
| `calculate_simple_projection` (Rust) | Simplified projection path | **Medium** |
| `useProjection` hook (TS) | WASM integration correctness | **High** |
| `usePeopleManagement` hook (TS) | State management correctness | **Medium** |
| Component rendering (TSX) | UI regression protection | **Low** |
| YAML import/export (TS) | Data round-trip correctness | **Medium** |

### Recommended Test Priority

1. **Add Rust unit tests** for `calculate_yearly_projections` and `calculate_projection` — these are the financial engine
2. **Add Rust unit tests** for `calculate_future_value` and `calculate_safe_withdrawal` — pure functions, easy to test
3. **Set up Vitest** and add tests for `useProjection` hook (WASM integration)
4. **Add round-trip tests** for YAML export/import (`yaml-utils.ts`)
5. **Add component smoke tests** for key components (SummaryCard, GrowthChart)

---

*Testing analysis: 2026-04-13*
