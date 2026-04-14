# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- TypeScript ~5.9.3 — Frontend UI, state management, data orchestration
- Rust 2021 Edition — Core financial calculation engine

**Secondary:**
- CSS (Tailwind CSS v4) — Styling and theming
- YAML — Data export/import format for retirement plans
- JavaScript (generated) — WASM bindings output from wasm-pack

## Runtime

**Browser Environment:**
- ES2022 target with DOM APIs
- WebAssembly for Rust core calculations
- No server-side runtime — fully static SPA

**Node.js (dev only):**
- Node 20 (pinned in CI via `actions/setup-node@v6`)
- Used for Vite dev server, build tooling, and package management

**Package Manager:**
- npm (with `package-lock.json`)
- Lockfile: Present (`frontend/package-lock.json`, root `package-lock.json`)
- Cargo for Rust (`backend/Cargo.lock` — gitignored)

## Frameworks

**Frontend Core:**
- React 19.2.0 — UI framework (latest, uses new JSX transform)
- Vite 7.2.4 — Build tool and dev server

**Styling:**
- Tailwind CSS 4.1.18 — Utility-first CSS framework (v4 with `@import "tailwindcss"` syntax)
- `@tailwindcss/vite` 4.2.1 — Vite plugin for Tailwind v4
- PostCSS 8.5.6 — CSS processing
- Autoprefixer 10.4.27 — Vendor prefix handling

**Charting:**
- Recharts 3.7.0 — React charting library for projection graphs
  - Used in `frontend/src/components/dashboard/GrowthChart.tsx`
  - Components: `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`

**Data Serialization:**
- js-yaml 4.1.1 — YAML export/import for retirement plans
  - Used in `frontend/src/lib/yaml-utils.ts`

## WASM Integration

**Build Tool:**
- wasm-pack — Builds Rust to WASM with JS bindings
  - Target: `web` (ES module output)
  - Crate type: `cdylib` + `rlib` (dual for WASM and native Rust testing)

**Rust→JS Bridge:**
- `wasm-bindgen` 0.2 — Rust/JS interop macros
- `serde-wasm-bindgen` 0.6 — Serde↔JsValue serialization (used instead of `wasm_bindgen::JsValue` direct conversion)
- `serde` 1.0 with `derive` — Rust serialization framework
- `serde_json` 1.0 — JSON serialization support
- `js-sys` 0.3 — Bindings to JS standard built-in objects

**WASM Loader Pattern:**
- File: `frontend/src/lib/wasm-loader.ts`
- Async initialization: `initWasm()` fetches WASM from `/wasm/retirement_core_bg.wasm`
- Singleton pattern: single `RetirementCalculator` instance cached after init
- Hook integration: `useProjection` hook calls `initWasm()` on mount

**Generated Artifacts:**
- `backend/pkg/retirement_core_bg.wasm` — Compiled WASM binary
- `backend/pkg/retirement_core.js` — JS bindings (copied to `frontend/src/lib/`)
- `backend/pkg/retirement_core.d.ts` — TypeScript declarations (copied to `frontend/src/lib/`)
- Deployment: WASM binary copied to `frontend/public/wasm/`

## Key Dependencies

**Critical (Frontend):**
- `react` ^19.2.0 / `react-dom` ^19.2.0 — UI rendering
- `recharts` ^3.7.0 — Projection chart visualization
- `js-yaml` ^4.1.1 — Plan export/import

**Critical (Backend):**
- `wasm-bindgen` 0.2 — JS interop
- `serde-wasm-bindgen` 0.6 — Serde↔JS conversion (avoids JSON stringification overhead)
- `serde` 1.0 — Data model serialization
- `js-sys` 0.3 — JS built-in type bindings

**Infrastructure (Frontend Dev):**
- `vite` ^7.2.4 — Build/bundle
- `@vitejs/plugin-react` ^5.1.4 — React Fast Refresh
- `tailwindcss` ^4.1.18 + `@tailwindcss/vite` ^4.2.1 — CSS processing
- `typescript` ~5.9.3 — Type checking

## Build & Tooling

**Build Commands:**
- `npm run dev` — Vite dev server (from `frontend/`)
- `npm run build` — TypeScript check (`tsc -b`) + Vite production build
- `npm run typecheck` — TypeScript type checking only
- `npm run lint` — ESLint via flat config
- `cd backend && cargo build` — Rust compilation
- `cd backend && wasm-pack build --target web` — WASM build

**WASM Build + Deploy Pipeline:**
1. `cd backend && wasm-pack build --target web`
2. `cp backend/pkg/retirement_core_bg.wasm frontend/public/wasm/`
3. `cp backend/pkg/retirement_core.js frontend/src/lib/`
4. `cp backend/pkg/retirement_core.d.ts frontend/src/lib/`

**Linting:**
- ESLint 9.39.1 with flat config (`frontend/eslint.config.js`)
- `typescript-eslint` 8.56.1 — TypeScript-specific rules
- `eslint-plugin-react-hooks` 7.0.1 — Rules of hooks enforcement
- `eslint-plugin-react-refresh` 0.5.2 — React Refresh component validation
- Rust: `cargo clippy -- -D warnings` + `cargo fmt -- --check`

**Formatting:**
- TypeScript/JS/CSS: 2-space indent (via `.editorconfig`)
- Rust: 4-space indent, `cargo fmt`
- TOML: 4-space indent

## Configuration

**TypeScript:**
- Strict mode enabled
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- `erasableSyntaxOnly: true` — No const enums or namespaces
- Path alias: `@/*` → `./src/*`
- Target: ES2022, JSX: `react-jsx`
- Excludes `src/lib/financial_math_wasm.ts` (generated file)

**Vite:**
- Base path: `/retire-eh/` on GitHub Pages, `/` locally
- Plugins: React + Tailwind CSS
- Path alias: `@` → `./src`

**Tailwind CSS v4:**
- Uses new `@import "tailwindcss"` syntax (not `@tailwind` directives)
- Custom dark mode variant: `@custom-variant dark (&:where(.dark, .dark *))`
- Custom theme: colors for gray scale, primary/secondary/warning/error, account-type colors (pretax/roth/taxable/hsa)
- Font: Inter (loaded from Google Fonts CDN)
- Dark mode: class-based toggling via `<html>` element

**Fonts:**
- Inter (weights 400, 500, 600, 700) loaded from Google Fonts CDN
- Fallback stack: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif

## Platform Requirements

**Development:**
- Node.js 20+
- Rust stable toolchain
- wasm-pack (`cargo install wasm-pack`)
- Modern browser with WebAssembly support

**Production:**
- Static file hosting (currently GitHub Pages)
- URL: https://halfguru.github.io/retire-eh/
- Browser requirements: ES2022, WebAssembly, CSS custom properties
- No server-side components

**CI/CD:**
- GitHub Actions
- Node 20 (CI pinned)
- Rust stable + wasm32-unknown-unknown target
- wasm-pack installed on-the-fly in CI

---

*Stack analysis: 2026-04-13*
