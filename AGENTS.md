# AGENTS.md

This file guides agentic coding agents working on Retire, Eh? — a Canadian retirement planning app.

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
App.tsx
├── Header.tsx (logo, export/import, dark mode)
├── Tabs.tsx (tab navigation)
├── Tab Content (one active at a time)
│   ├── OverviewTab.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── ViewSelector.tsx
│   │   ├── PortfolioCard.tsx
│   │   ├── RetirementProjectionCard.tsx
│   │   └── GoalsCard.tsx
│   ├── PlanTab.tsx
│   │   ├── PersonSelector.tsx
│   │   ├── PersonForm.tsx
│   │   └── AssumptionsPanel.tsx
│   ├── ProjectionsTab.tsx
│   │   └── GrowthChart.tsx
│   ├── IncomeTab.tsx
│   │   └── IncomeBreakdownCard.tsx
│   └── LearnTab.tsx
└── Footer.tsx
```

### State Management

- All state lives in `App.tsx`
- Tab components receive props and render
- Changes in Plan tab immediately update other tabs (real-time)
- Active tab state: `activeTab: 'overview' | 'plan' | 'projections' | 'income' | 'learn'`

### Mobile Responsiveness

- Tabs scroll horizontally on mobile
- Tab bar is sticky at top
- Touch-friendly hit areas (min 44px height)

## OpenCode Workflow

This project includes custom OpenCode commands and agents for structured development.

### Commands

| Command | Description |
|---------|-------------|
| `/feature <name>` | Full workflow: explore → plan → build → validate → PR |
| `/review` | Multi-specialist code review (frontend, WASM, infra) |
| `/prepare-pr` | Generate PR with WASM artifact validation |

### Agents

| Agent | Specialization |
|-------|----------------|
| `@review-frontend` | React/TypeScript patterns, accessibility, performance |
| `@review-wasm` | Rust/WASM best practices, memory safety |
| `@review-infra` | CI/CD pipelines, build process, security |

### Skills

Skills are loaded on-demand via `/skill <name>` (located in `.agents/skills/`):
- `react-component` - React component patterns with TypeScript
- `wasm-workflow` - WASM build and integration workflow
