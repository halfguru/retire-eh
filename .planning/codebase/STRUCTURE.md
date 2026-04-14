# Codebase Structure

**Analysis Date:** 2026-04-13

## Directory Layout

```
retire-eh/                         # Project root
├── .agents/                       # Agent skills (react-component, wasm-workflow)
│   └── skills/
│       ├── react-component/SKILL.md
│       └── wasm-workflow/SKILL.md
├── .github/                       # GitHub Actions CI/CD
│   └── workflows/
│       ├── ci.yml                 # PR/push CI: lint, test, build
│       ├── deploy.yml             # Deploy to GitHub Pages on main push
│       └── release.yml            # Create GitHub Release on version tags
├── backend/                       # Rust WASM computation core
│   ├── src/
│   │   ├── lib.rs                 # WASM entry point, RetirementCalculator struct
│   │   ├── models.rs              # Data structs (HouseholdConfig, AccountBalance, etc.)
│   │   └── calculations.rs        # Financial calculation functions
│   ├── tests/
│   │   └── calculations_test.rs   # Rust integration tests
│   ├── pkg/                       # WASM build output (generated, partially committed)
│   │   ├── retirement_core.js     # JS glue module
│   │   ├── retirement_core.d.ts   # TypeScript declarations
│   │   ├── retirement_core_bg.wasm # WASM binary
│   │   ├── retirement_core_bg.wasm.d.ts
│   │   ├── package.json
│   │   └── .gitignore
│   ├── Cargo.toml                 # Rust dependencies
│   └── Cargo.lock                 # Rust lockfile
├── frontend/                      # React SPA
│   ├── public/
│   │   ├── wasm/                  # WASM binary served statically
│   │   │   └── retirement_core_bg.wasm
│   │   ├── favicon.svg
│   │   └── vite.svg
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Root component, all state, tab routing
│   │   ├── App.css                # Animations (fadeInUp), legacy styles
│   │   ├── index.css              # Tailwind imports, theme colors, global styles
│   │   ├── components/
│   │   │   ├── Header.tsx         # App header with controls
│   │   │   ├── Footer.tsx         # GitHub link footer
│   │   │   ├── Tabs.tsx           # Tab navigation bar
│   │   │   └── dashboard/         # All tab content components
│   │   │       ├── AccountCard.tsx
│   │   │       ├── AssumptionsPanel.tsx
│   │   │       ├── GoalsCard.tsx
│   │   │       ├── GrowthChart.tsx
│   │   │       ├── IncomeBreakdownCard.tsx
│   │   │       ├── IncomeTab.tsx
│   │   │       ├── InfoTooltip.tsx
│   │   │       ├── LearnTab.tsx
│   │   │       ├── OverviewTab.tsx
│   │   │       ├── PersonForm.tsx
│   │   │       ├── PersonSelector.tsx
│   │   │       ├── PlanTab.tsx
│   │   │       ├── PortfolioCard.tsx
│   │   │       ├── ProjectionsTab.tsx
│   │   │       ├── RetirementProjectionCard.tsx
│   │   │       ├── SummaryCard.tsx
│   │   │       └── ViewSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useDarkMode.ts     # Dark mode toggle + localStorage
│   │   │   ├── useLocalStorage.ts # Generic localStorage hook (not actively used in App)
│   │   │   ├── usePeopleManagement.ts  # People/accounts state + CRUD
│   │   │   └── useProjection.ts   # WASM integration + projection calculation
│   │   ├── lib/
│   │   │   ├── wasm-loader.ts     # Async WASM initialization + singleton
│   │   │   ├── yaml-utils.ts      # YAML export/import/download/upload
│   │   │   ├── retirement_core.d.ts      # Copied from backend/pkg/
│   │   │   ├── retirement_core.js        # Copied from backend/pkg/
│   │   │   ├── retirement_core_bg.wasm.d.ts  # Copied from backend/pkg/
│   │   │   └── financial_math_wasm.d.ts  # Legacy type file
│   │   ├── types/
│   │   │   └── household.ts       # TypeScript interfaces matching Rust models
│   │   └── assets/
│   │       └── react.svg          # Unused React logo
│   ├── index.html                 # HTML shell (loads Inter font)
│   ├── package.json               # Node dependencies
│   ├── package-lock.json          # Lockfile
│   ├── vite.config.ts             # Vite config with @ alias, Tailwind plugin
│   ├── tsconfig.json              # Root TS config
│   ├── tsconfig.app.json          # App TS config
│   └── tsconfig.node.json         # Node TS config
├── AGENTS.md                      # Agent instructions
├── README.md                      # Project documentation
├── LICENSE                        # License file
├── renovate.json                  # Renovate bot config
├── .editorconfig                  # Editor formatting rules
├── .gitignore
└── package-lock.json              # Root lockfile (references frontend)
```

## Directory Purposes

**`backend/src/`:**
- Purpose: Rust source code compiled to WASM
- Contains: Library entry point, financial models, calculation functions
- Key files: `lib.rs` (WASM bridge), `models.rs` (data structs), `calculations.rs` (math)

**`backend/tests/`:**
- Purpose: Rust integration tests
- Contains: Tests for calculation functions (binary search, projection accuracy)
- Key files: `calculations_test.rs`

**`backend/pkg/`:**
- Purpose: wasm-pack build output — JS/WASM artifacts for frontend consumption
- Generated: Yes, by `wasm-pack build --target web`
- Committed: Partially (`.gitignore` present but some files may be committed)
- Key files: `retirement_core.js`, `retirement_core.d.ts`, `retirement_core_bg.wasm`

**`frontend/src/components/`:**
- Purpose: Top-level shared components (Header, Footer, Tabs)
- Key files: `Header.tsx`, `Tabs.tsx`, `Footer.tsx`

**`frontend/src/components/dashboard/`:**
- Purpose: All tab-specific content components
- Contains: 16 component files, one per UI card/section
- Naming: PascalCase matching component name (e.g., `SummaryCard.tsx` exports `SummaryCard`)

**`frontend/src/hooks/`:**
- Purpose: Custom React hooks for state management and side effects
- Key files: `usePeopleManagement.ts` (core domain state), `useProjection.ts` (WASM integration)

**`frontend/src/lib/`:**
- Purpose: Utility modules and WASM bindings
- Contains: WASM loader, YAML utilities, copied WASM JS/TS artifacts
- Key files: `wasm-loader.ts` (async init), `yaml-utils.ts` (import/export)

**`frontend/src/types/`:**
- Purpose: Shared TypeScript type definitions
- Key files: `household.ts` (interfaces matching Rust model structs)

**`frontend/public/wasm/`:**
- Purpose: Static WASM binary served at runtime
- Contains: `retirement_core_bg.wasm`
- Generated: Yes, copied from `backend/pkg/` during build

**`.github/workflows/`:**
- Purpose: CI/CD pipeline definitions
- Key files: `ci.yml` (test + lint), `deploy.yml` (GitHub Pages deploy), `release.yml` (releases)

## Key File Locations

**Entry Points:**
- `frontend/src/main.tsx`: React app bootstrap, renders `<App />` into `#root`
- `frontend/index.html`: HTML shell, loads `main.tsx` as ES module
- `backend/src/lib.rs`: Rust/WASM entry point, declares `RetirementCalculator` struct

**Configuration:**
- `frontend/vite.config.ts`: Vite build config with `@` path alias and Tailwind plugin
- `frontend/package.json`: Frontend dependencies and scripts
- `backend/Cargo.toml`: Rust crate config, `crate-type = ["cdylib", "rlib"]`
- `.github/workflows/ci.yml`: CI pipeline (typecheck, lint, test, build)
- `.github/workflows/deploy.yml`: Deploy pipeline (WASM build → frontend build → GitHub Pages)

**Core Logic:**
- `frontend/src/App.tsx`: All application state, derived calculations, tab routing
- `frontend/src/hooks/usePeopleManagement.ts`: Person/account CRUD operations
- `frontend/src/hooks/useProjection.ts`: WASM call wrapper, projection data transformation
- `frontend/src/lib/wasm-loader.ts`: WASM async initialization singleton
- `backend/src/calculations.rs`: All financial math (future value, projections, binary search)
- `backend/src/models.rs`: Rust data structs with serde serialization

**Testing:**
- `backend/tests/calculations_test.rs`: Rust integration tests for calculation functions
- No frontend test files detected

**Types:**
- `frontend/src/types/household.ts`: TypeScript interfaces matching Rust models (snake_case)
- `frontend/src/hooks/usePeopleManagement.ts`: `Person`, `Account` interfaces (camelCase)
- `frontend/src/hooks/useProjection.ts`: `ProjectionDataPoint` interface
- `frontend/src/lib/yaml-utils.ts`: `RetirementPlan`, `PlanAssumptions`, `PersonData` interfaces

## Naming Conventions

**Files:**
- React components: PascalCase matching export name (`SummaryCard.tsx` → `export function SummaryCard`)
- Hooks: camelCase with `use` prefix (`useDarkMode.ts` → `export function useDarkMode`)
- Utility modules: kebab-case (`wasm-loader.ts`, `yaml-utils.ts`)
- Rust modules: snake_case (`calculations.rs`, `models.rs`)

**Directories:**
- React component groups: lowercase (`dashboard/`, `components/`)
- Rust modules: lowercase (`src/`, `tests/`)

## Where to Add New Code

**New Tab/Section:**
1. Create tab component: `frontend/src/components/dashboard/NewTab.tsx`
2. Add tab definition to `tabs` array in `frontend/src/components/Tabs.tsx`
3. Add `TabId` union member in `frontend/src/App.tsx`
4. Add `case` in `renderTab()` switch in `App.tsx`
5. Pass required props from `App.tsx`

**New Dashboard Card:**
1. Create component: `frontend/src/components/dashboard/NewCard.tsx`
2. Import and use in the appropriate tab component (e.g., `OverviewTab.tsx`)
3. Define props interface, receive data from parent tab

**New Person/Account Field:**
1. Add field to `Person` interface in `frontend/src/hooks/usePeopleManagement.ts`
2. Add to default person object
3. Add to `updatePerson` callback or create new `updatePerson*` function
4. Add to YAML export/import in `frontend/src/lib/yaml-utils.ts`
5. Add form input in `frontend/src/components/dashboard/PersonForm.tsx`

**New WASM Calculation:**
1. Add Rust function in `backend/src/calculations.rs`
2. Add any new models in `backend/src/models.rs`
3. Expose via `RetirementCalculator` impl in `backend/src/lib.rs` with `#[wasm_bindgen]`
4. Add Rust tests in `backend/tests/calculations_test.rs`
5. Rebuild WASM: `cd backend && wasm-pack build --target web`
6. Copy artifacts to frontend
7. Call from `frontend/src/hooks/useProjection.ts` or directly via `getCalculator()`

**New Shared Utility:**
1. Create file in `frontend/src/lib/` (kebab-case naming)
2. Import via `@/lib/filename`

**New Shared Type:**
1. Add to `frontend/src/types/household.ts` for Rust-aligned types
2. Or co-locate in the hook file that defines the interface (e.g., `usePeopleManagement.ts`)

## Special Directories

**`backend/pkg/`:**
- Purpose: wasm-pack output directory
- Generated: Yes, by `wasm-pack build --target web`
- Committed: Has `.gitignore` but some files are tracked
- Must be rebuilt after Rust changes

**`frontend/public/wasm/`:**
- Purpose: WASM binary served as static asset
- Generated: Yes, must be copied from `backend/pkg/` after WASM build
- The WASM file is fetched at runtime by the browser

**`frontend/dist/`:**
- Purpose: Vite build output
- Generated: Yes, by `npm run build`
- Not committed (in `.gitignore`)

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents (this file)
- Generated: Yes, by the GSD mapping process
- Committed: Yes

**`.agents/skills/`:**
- Purpose: Agent skill definitions for OpenCode workflow
- Contains: `react-component/SKILL.md`, `wasm-workflow/SKILL.md`

**`.opencode/`:**
- Purpose: OpenCode SDK and configuration
- Contains: `node_modules/` with `@opencode-ai/sdk`

## Import Path Aliases

**`@/` → `frontend/src/`** (configured in `frontend/vite.config.ts`)
- Usage: `import { Header } from '@/components/Header'`
- Usage: `import { useDarkMode } from '@/hooks/useDarkMode'`
- Usage: `import { getCalculator } from '@/lib/wasm-loader'`

---

*Structure analysis: 2026-04-13*
