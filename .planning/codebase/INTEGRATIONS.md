# External Integrations

**Analysis Date:** 2026-04-13

## APIs & External Services

**Google Fonts CDN:**
- Service: Google Fonts (`https://fonts.googleapis.com`, `https://fonts.gstatic.com`)
- Purpose: Loads Inter font family (weights 400, 500, 600, 700)
- Files: `frontend/index.html` (lines 9-11)
- Auth: None (public CDN)
- Preconnect hints configured for performance

**GitHub Pages:**
- Service: Static hosting via GitHub Pages
- Purpose: Production deployment of the SPA
- Config: `GITHUB_PAGES` env var triggers `/retire-eh/` base path in `frontend/vite.config.ts`
- URL: https://halfguru.github.io/retire-eh/

**No other external APIs:**
- No authentication services
- No database services
- No analytics or tracking services
- No payment or financial data providers

## Data Storage

**Databases:**
- None — fully client-side application

**Browser Storage:**
- localStorage — All application state persistence
  - `people` (JSON): Person and account data
  - `expectedReturn`, `inflationRate`, `replacementRate`, `withdrawalRate`: Numeric settings
  - `showRealValues`, `darkMode`: Boolean preferences
  - Per-person fields: `person_{idx}_currentAge`, `person_{idx}_retirementAge`, `person_{idx}_annualPension`
  - Per-account fields: `account_{id}_balance`, `account_{id}_annualContribution`
  - Implementation: `frontend/src/hooks/useLocalStorage.ts`, `frontend/src/App.tsx`

**File Storage:**
- YAML export/import for plan backup and transfer
  - Export: `frontend/src/lib/yaml-utils.ts` → `exportToYAML()` + `downloadYAML()`
  - Import: `uploadYAML()` → `importFromYAML()`
  - Browser File API for reading, Blob + URL.createObjectURL for writing
  - No cloud storage integration

**Caching:**
- None — no service worker, no HTTP caching strategy, no IndexedDB

## Authentication & Identity

**Auth Provider:**
- None — no authentication required
- Fully anonymous, client-side only application
- No user accounts or sessions

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Bugsnag, or similar service
- Errors logged to `console.error` only

**Logs:**
- Browser console only (`console.error` in wasm-loader and yaml-utils)
- No structured logging

**Analytics:**
- None — no Google Analytics, Plausible, or similar

## CI/CD & Deployment

**Hosting:**
- GitHub Pages (static site hosting)
- Deployed via GitHub Actions on push to `main`
- Config: `.github/workflows/deploy.yml`

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Triggers: push/PR to `main` or `develop`
- Frontend job: typecheck, lint, build
- Backend job: `cargo test`, `cargo clippy`, `cargo fmt --check`, WASM build

**Release Pipeline:**
- GitHub Actions (`.github/workflows/release.yml`)
- Triggers: version tags (`v*`)
- Builds WASM + frontend, creates zip artifact
- Creates GitHub Release with `softprops/action-gh-release@v3`

**Dependency Management:**
- Renovate Bot (config: `renovate.json`)
- Schedule: every weekend
- Auto-merge: minor/patch updates for frontend devDeps and Rust crates
- Major updates: manual review required
- Lock file maintenance: enabled with auto-merge

## Frontend Dependencies

### Runtime Dependencies

| Package | Version | Purpose | Key Files |
|---------|---------|---------|-----------|
| `react` | ^19.2.0 | UI framework | All `.tsx` files |
| `react-dom` | ^19.2.0 | DOM rendering | `frontend/src/main.tsx` |
| `recharts` | ^3.7.0 | Chart visualization | `frontend/src/components/dashboard/GrowthChart.tsx` |
| `js-yaml` | ^4.1.1 | YAML serialization | `frontend/src/lib/yaml-utils.ts` |
| `@tailwindcss/vite` | ^4.2.1 | Tailwind v4 Vite plugin | `frontend/vite.config.ts` |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.3 | Type checking |
| `vite` | ^7.2.4 | Build tool and dev server |
| `@vitejs/plugin-react` | ^5.1.4 | React Fast Refresh |
| `tailwindcss` | ^4.1.18 | CSS framework |
| `postcss` | ^8.5.6 | CSS processing |
| `autoprefixer` | ^10.4.27 | Vendor prefixing |
| `eslint` | ^9.39.1 | Linting |
| `@eslint/js` | ^9.39.1 | Core ESLint rules |
| `typescript-eslint` | ^8.56.1 | TypeScript ESLint rules |
| `eslint-plugin-react-hooks` | ^7.0.1 | React hooks rules |
| `eslint-plugin-react-refresh` | ^0.5.2 | React Refresh validation |
| `globals` | ^17.4.0 | Global variable definitions |
| `@types/js-yaml` | ^4.0.9 | Type definitions for js-yaml |
| `@types/node` | ^25.3.3 | Node.js type definitions |
| `@types/react` | ^19.2.14 | React type definitions |
| `@types/react-dom` | ^19.2.3 | React DOM type definitions |

## Backend Dependencies

### Runtime Crates

| Crate | Version | Purpose | Key Files |
|-------|---------|---------|-----------|
| `wasm-bindgen` | 0.2 | Rust↔JS FFI bindings | `backend/src/lib.rs` |
| `serde` | 1.0 (derive) | Serialization/deserialization | `backend/src/models.rs`, `backend/src/calculations.rs` |
| `serde_json` | 1.0 | JSON support (dependency of serde ecosystem) | Indirect |
| `serde-wasm-bindgen` | 0.6 | Serde↔JsValue conversion | `backend/src/lib.rs` (all `#[wasm_bindgen]` methods) |
| `js-sys` | 0.3 | JS built-in type bindings | Indirect via wasm-bindgen |

### No Dev Crate Dependencies
- No dev-dependencies declared in `backend/Cargo.toml`
- Tests use only the library itself (integration tests in `backend/tests/`)

## Internal Module Boundaries

### Frontend → WASM Bridge

**Data Flow:**
```
React Components (TSX)
  → useProjection hook (frontend/src/hooks/useProjection.ts)
    → wasm-loader (frontend/src/lib/wasm-loader.ts)
      → retirement_core.js (generated JS bindings)
        → retirement_core_bg.wasm (compiled Rust)
```

**Serialization Pattern:**
- Frontend creates plain JS objects matching Rust struct field names (snake_case)
- `serde-wasm-bindgen` handles JS↔Rust conversion automatically
- Rust structs use `#[derive(Serialize, Deserialize)]`
- `SimpleProjection` uses `#[serde(rename_all = "camelCase")]` for JS convention

**Exposed Rust API (via `RetirementCalculator` class):**

| Method | Input | Output | Used By |
|--------|-------|--------|---------|
| `calculate_yearly_projections` | HouseholdConfig, AccountBalance, ContributionConfig, Assumptions, currentAge | `Vec<YearlyProjection>` | `useProjection` hook (primary) |
| `calculate_projection` | + ChildInfo | `RetirementProjection` | Currently unused in frontend |
| `calculate_simple_projection` | portfolio, ages, rate, year | `Vec<SimpleProjection>` | Currently unused in frontend |
| `calculate_additional_annual_savings` | portfolio, target, years, rates | `f64` | Currently unused in frontend |

### Frontend Internal Boundaries

```
App.tsx (state owner)
  ├── Hooks Layer
  │   ├── useDarkMode        — Theme toggle + localStorage
  │   ├── usePeopleManagement — Person/account CRUD + localStorage
  │   ├── useProjection       — WASM init + projection calculation
  │   └── useLocalStorage     — Generic localStorage hook
  │
  ├── Components Layer
  │   ├── Header, Footer, Tabs — Shell UI
  │   └── dashboard/*          — Tab content components
  │
  ├── Lib Layer
  │   ├── wasm-loader.ts       — WASM initialization singleton
  │   ├── yaml-utils.ts        — YAML export/import
  │   └── retirement_core.*    — Generated WASM bindings
  │
  └── Types Layer
      └── household.ts         — Shared type definitions (mirrors Rust models)
```

**State Management Pattern:**
- All state lives in `App.tsx` (no external state library)
- State flows down via props to tab components
- Local changes trigger recalculation via `useMemo` hooks
- Persistence is manual: `useEffect` in `App.tsx` writes to localStorage on every state change

**Type Sharing Between Frontend and Backend:**
- No automated type generation pipeline
- Types manually maintained in two places:
  - Rust: `backend/src/models.rs` (e.g., `HouseholdConfig`, `AccountBalance`)
  - TypeScript: `frontend/src/types/household.ts` (mirrors Rust structs)
  - TypeScript: `frontend/src/hooks/usePeopleManagement.ts` (`Person`, `Account` interfaces)
- WASM type declarations auto-generated: `frontend/src/lib/retirement_core.d.ts`
- Field naming: Rust uses `snake_case`, JS bridge uses `snake_case` via serde-wasm-bindgen

## Environment Configuration

**Required env vars:**
- `GITHUB_PAGES` — Set to truthy value for production deployment (changes Vite base path)
- `.env` and `.env*.local` — gitignored but no evidence of active use

**No secrets or API keys required** — fully client-side application

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-04-13*
