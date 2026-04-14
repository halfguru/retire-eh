# AGENTS.md

This file guides agentic coding agents working on Retire, Eh?, a Canadian retirement planning app.

## Build Commands

### Frontend (React + TypeScript)
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm test` - Run all tests
- `npm test -- --watch` - Watch mode
- `npm test -- path/to/test.test.tsx` - Run single test file
- `npm test -- -t "test name"` - Run tests matching name

### Rust Core (WASM)
- `cd backend && cargo build` - Build Rust code
- `cd backend && cargo build --release` - Optimize for production
- `cd backend && cargo test` - Run Rust tests
- `cd backend && cargo test test_name` - Run single test
- `cd backend && cargo clippy` - Lint Rust code
- `cd backend && cargo fmt` - Format Rust code
- `cd backend && wasm-pack build --target web` - Build WASM package (run from root: `cd backend && wasm-pack build --target web`)
- After building WASM: `cp backend/pkg/retirement_core_bg.wasm frontend/public/wasm/` - Copy WASM to frontend
- After building WASM: `cp backend/pkg/retirement_core.js frontend/src/lib/ && cp backend/pkg/retirement_core.d.ts frontend/src/lib/` - Copy JS bindings and types to frontend
- Note: All copy commands should be run from project root directory

## GitHub Actions

### CI Pipeline (`.github/workflows/ci.yml`)
- Runs on push/PR to `main` and `develop` branches
- **Frontend**: Type check, lint, build
- **Backend**: Tests, clippy lint, format check, WASM build

### Deploy Pipeline (`.github/workflows/deploy.yml`)
- Runs on push to `main` branch
- Builds WASM and frontend
- Deploys to GitHub Pages: https://halfguru.github.io/retire-eh/

### Release Pipeline (`.github/workflows/release.yml`)
- Runs on version tags (`v*`, e.g., `v1.0.0`)
- Builds and creates GitHub Release with artifacts
- Uses semantic versioning

## Philosophy Alignment

- Prioritize clarity over cleverness
- Comments should explain "why", not "what"
- Use conservative assumptions as defaults
- Use neutral, professional visuals and interactions

## UI Architecture

### Tab Navigation

The app uses a horizontal tab layout with 5 sections:

| Tab | Purpose | Default |
|-----|---------|---------|
| Plan | Input: people, accounts, assumptions | Yes |
| Overview | Summary card, key metrics, goal progress | No |
| Projections | Growth charts and projection details | No |
| Income | Retirement income breakdown by source | No |
| Learn | Educational content about methodology | No |

### Component Structure

```
App.tsx (provider shell)
├── PeopleProvider
│   └── AssumptionsProvider
│       └── ProjectionProvider
│           └── AppContent
│               ├── Header.tsx (logo, export/import, dark mode)
│               ├── Tabs.tsx (tab navigation)
│               ├── Tab Content (one active at a time)
│               │   ├── OverviewTab.tsx
│               │   │   ├── SummaryCard.tsx
│               │   │   ├── ViewSelector.tsx
│               │   │   ├── PortfolioCard.tsx
│               │   │   ├── RetirementProjectionCard.tsx
│               │   │   └── GoalsCard.tsx
│               │   ├── PlanTab.tsx
│               │   │   ├── PersonSelector.tsx
│               │   │   ├── PersonForm.tsx
│               │   │   └── AssumptionsPanel.tsx
│               │   ├── ProjectionsTab.tsx
│               │   │   └── GrowthChart.tsx (lazy-loaded)
│               │   ├── IncomeTab.tsx
│               │   │   └── IncomeBreakdownCard.tsx
│               │   └── LearnTab.tsx
│               └── Footer.tsx (version display)
├── ErrorBoundary (shell-level)
└── ErrorBoundary (tab-level, wrapping tab content)
```

### State Management

- State is split across React Context providers (see `src/contexts/`)
- `PeopleProvider` owns people CRUD and selection via `useReducer`
- `AssumptionsProvider` owns assumptions with localStorage persistence
- `ProjectionProvider` derives projection data from both contexts
- `usePersistence` hook coordinates localStorage writes
- `App.tsx` is a thin layout shell (~60 lines) that nests providers
- Leaf components consume contexts directly via hooks (`usePeople`, `useAssumptions`, `useProjectionContext`)
- Active tab state lives in `AppContent` component

### Mobile Responsiveness

- Tabs scroll horizontally on mobile
- Tab bar is sticky at top
- Touch-friendly hit areas (min 44px height)

## Testing

### Frontend (60 tests)
- `src/test/wasm-bridge.test.ts` - WASM bridge integration tests (snake_case field mapping)
- `src/test/people-context.test.tsx` - PeopleContext consumer tests (CRUD, selection, import)
- `src/test/validation.test.ts` - Zod validation tests
- `src/test/yaml-utils.test.ts` - YAML import/export tests
- `src/test/wasm-loader.test.ts` - WASM loader unit tests
- Tests use `vi.mock('@/lib/retirement_core.js')` with a class-based mock
- Mock factory is hoisted by vitest: all variables must be defined inside the factory

### Backend (19 tests)
- `backend/tests/calculations_test.rs` - All Rust calculation functions with edge cases

### Shared Utilities
- `src/lib/formatting.ts` - `formatMoney()`, `formatCompactMoney()` for all currency display
- `src/hooks/useRetirementGoal.ts` - shared goal calculation hook
- `src/lib/validation.ts` - Zod schemas for YAML import and form validation