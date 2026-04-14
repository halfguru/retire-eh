# Domain Pitfalls

**Domain:** React 19 + Rust/WASM brownfield refactoring — correctness fixes, deduplication, state decomposition, testing, and deployment for a Canadian retirement planning SPA
**Researched:** 2026-04-13
**Confidence:** HIGH (analysis grounded in actual codebase inspection; pitfalls derived from real code patterns, verified against source)

## Critical Pitfalls

### Pitfall 1: Context Decomposition Splits localStorage Ownership

**What goes wrong:**
When decomposing App.tsx's monolithic state into separate context providers (PeopleContext, AssumptionsContext, ProjectionContext), the `saveToLocalStorage` callback (App.tsx:78-94) that writes 8 separate localStorage keys on every state change gets fragmented. One context writes `people`, another writes `expectedReturn`/`inflationRate`, and the writes become race-prone. Worse, `usePeopleManagement` already initializes from localStorage (line 39-49) while App.tsx also writes redundant per-field keys (`person_0_currentAge`, `person_0_retirementAge`, etc.) that nothing reads — creating confusion about which keys are canonical.

**Why it happens:**
Developers see "App.tsx is too big" and mechanically extract state into contexts. Each context gets its own `useEffect` for persistence. The original code had a single `useCallback` depending on all state values (line 78-94), guaranteeing atomic writes. Splitting this means writes are no longer coordinated — `people` might update while `expectedReturn` still holds stale data. A page refresh mid-write leaves partial state.

**How to avoid:**
- **Do NOT split the persistence `useEffect` into each context.** Instead, create a single `usePersistence` hook or a `PersistenceProvider` that subscribes to all contexts and writes atomically.
- Before decomposition, map every localStorage key to exactly one owner. The current code writes `person_IDX_field` keys (lines 79-86) that nothing reads — remove these dead writes during the same refactor.
- The YAML import path (`handleImport` at App.tsx:159-173) writes to multiple state setters atomically — this must remain atomic post-refactor. Either keep import logic in a coordinator component, or have import write to a single unified state that fans out.

**Warning signs:**
- Multiple contexts each containing their own `useEffect` for `localStorage.setItem`
- localStorage reads happening in context initializer functions (already exists at `usePeopleManagement.ts:39-49`)
- Tests that assert localStorage state after individual context updates

**Phase to address:**
Phase that decomposes App.tsx into context providers. This must be the FIRST thing designed, not bolted on after contexts are carved out.

---

### Pitfall 2: Derived State That Crosses Context Boundaries

**What goes wrong:**
App.tsx computes derived values that depend on state from multiple future contexts: `householdRetirementAge` uses `people` (PeopleContext), `totalAnnualIncome` uses `people` (PeopleContext), and `projectionData` uses `people`, `expectedReturn`, `inflationRate`, `showRealValues` (People + Assumptions + UI contexts). When these live in separate contexts, the derived values must either (a) live in a parent that reads multiple contexts (defeating the purpose), or (b) each context re-exposes raw state so a downstream consumer can derive (creating tight coupling anyway).

Specifically: `projectionData` (line 120-123) and `realProjectionData` (line 133-142) are computed as `useMemo` hooks that combine people + assumptions + WASM results. If people moves to PeopleContext and assumptions to AssumptionsContext, the projection computation must live somewhere that can access both — likely a ProjectionContext that depends on the other two. This creates a context dependency chain where ProjectionContext must be nested inside both PeopleContext and AssumptionsContext providers.

**Why it happens:**
State was centralized specifically BECAUSE these values are interdependent. Mechanical decomposition without analyzing data flow creates circular dependencies or deeply nested provider trees.

**How to avoid:**
- Map the dependency graph BEFORE extracting contexts. The actual dependency structure is:
  ```
  PeopleContext -> provides people, selectedPersonId, account CRUD
  AssumptionsContext -> provides expectedReturn, inflationRate, replacementRate, withdrawalRate, showRealValues
  ProjectionContext -> CONSUMES PeopleContext + AssumptionsContext, provides projectionData, individualProjectionData, realProjectionData
  ```
- `ProjectionContext` must be rendered inside `<PeopleProvider>` and `<AssumptionsProvider>` — document this nesting requirement explicitly.
- Alternative: combine People + Assumptions into a single `PlanContext` since they're always used together for projections. A `PlanContext` that owns all data needed for calculations avoids the cross-context dependency entirely.

**Warning signs:**
- Provider nesting deeper than 3 levels
- A context's `useMemo` hooks calling `useContext()` from another context
- Components that import from multiple contexts just to derive a single value

**Phase to address:**
Phase that designs context boundaries — before any code is moved. Draw the provider tree on paper first.

---

### Pitfall 3: WASM Binding Changes Break Committed JS Artifacts

**What goes wrong:**
The Rust function `calculate_yearly_projections` hardcodes `let current_year = 2025` (calculations.rs:85). The fix is to accept `current_year` as a parameter. But changing this Rust function signature also changes the WASM binding — the JS `calculate_yearly_projections` call in useProjection.ts (line 67-73) must add a new parameter. Meanwhile, the old `retirement_core.js` and `retirement_core.d.ts` files are committed to the repo. A developer could fix the Rust code, rebuild WASM, but forget to copy the new bindings to `frontend/src/lib/`. Or they could copy the bindings but not update the calling code. The deployed app then has mismatched WASM binary + JS bindings + calling code.

Even worse: the TypeScript types at the boundary are all `any` (retirement_core.d.ts has 9 instances of `any`), so the compiler won't catch a parameter mismatch.

**Why it happens:**
The WASM build pipeline is manual: `wasm-pack build` -> copy 3 files -> commit. There's no automated check that committed bindings match the built WASM. The CI pipeline builds fresh, but local development can drift.

**How to avoid:**
- When changing any Rust function exposed via `#[wasm_bindgen]`, make ALL of the following changes in a single atomic commit:
  1. Change the Rust code
  2. Run `cd backend && wasm-pack build --target web`
  3. Copy all 3 output files to frontend
  4. Update ALL calling code in `useProjection.ts` and any other consumers
  5. Update the manual type wrappers in `wasm-loader.ts`
  6. Run `npm run typecheck` to verify
- Add a CI step that verifies committed JS bindings match freshly built WASM. Or: stop committing `retirement_core.js` and `retirement_core.d.ts` and generate them in CI only.
- Write the manual type wrappers BEFORE changing the Rust code, so you have a type-safe interface to update.

**Warning signs:**
- `retirement_core.d.ts` still has `any` parameter types after "type wrapping"
- `wasm-pack build` output not reflected in committed files
- Typecheck passes but WASM calls fail at runtime with "Failed to parse..." errors

**Phase to address:**
Phase that fixes hardcoded year in Rust — this is a correctness bug that changes the WASM API surface.

---

### Pitfall 4: YAML Import Validation Allows State Corruption

**What goes wrong:**
`importFromYAML` (yaml-utils.ts:53-64) does `yaml.load(yamlString) as RetirementPlan` — the `as` assertion provides zero runtime safety. The only checks are `!parsed.assumptions` and `!parsed.people` (truthy checks). This means:
- A YAML file with `people: [{currentAge: -5}]` passes validation and sets negative ages
- A YAML file with `people: [{currentAge: "thirty"}]` passes and sets a string where a number is expected
- A YAML file with extra fields like `people: [{evil: true}]` passes and injects unknown properties
- `handleImport` in App.tsx (line 159-173) then spreads this directly into `setPeople(plan.people)` with no further validation

The consequences are serious: if the imported data has `currentAge: "thirty"`, the WASM deserialization will throw at runtime, but by then the state is already corrupted — the user's plan shows no projections and their real data is overwritten.

**Why it happens:**
TypeScript's type system only exists at compile time. `as RetirementPlan` tells the compiler "trust me" but does nothing at runtime. This is especially dangerous in YAML import because YAML is a dynamic format from external files.

**How to avoid:**
- Write validation functions that check types and ranges at runtime:
  - `typeof p.currentAge === 'number' && p.currentAge > 0 && p.currentAge < 120`
  - `typeof p.retirementAge === 'number' && p.retirementAge > p.currentAge`
  - `Array.isArray(p.accounts) && p.accounts.every(validateAccount)`
- Call validation BEFORE `setPeople` in `handleImport`
- On validation failure, show a user-friendly error and DO NOT update state
- The validation should also strip unknown fields (allowlisted properties only)
- Test the validation with malformed YAML files (negative ages, string numbers, extra fields, missing required fields)

**Warning signs:**
- `as SomeType` assertions on data from external sources
- Validation that only checks for truthiness (`if (!parsed.assumptions)`)
- No error boundary between import and state mutation

**Phase to address:**
Early phase — this is a security/correctness issue that affects all downstream features.

---

### Pitfall 5: Type Consolidation Confusion — Three Parallel Hierarchies

**What goes wrong:**
There are currently THREE parallel type hierarchies:
1. **Frontend domain types** — `Person`, `Account` in `usePeopleManagement.ts` (camelCase fields)
2. **YAML types** — `PersonData` in `yaml-utils.ts` (identical shape to Person but separately defined)
3. **WASM-facing types** — `HouseholdConfig`, `AccountBalance`, etc. in `household.ts` (snake_case fields matching Rust)

The WASM boundary speaks **snake_case** by default — `serde-wasm-bindgen` does NOT auto-convert to camelCase. Verified: `models.rs` structs have NO `#[serde(rename_all = "camelCase")]` attribute. Only `SimpleProjection` in `calculations.rs` has the rename annotation. The JS code at `useProjection.ts:75` reads `p.total_net_worth` (snake_case), confirming the WASM boundary uses snake_case.

**The `household.ts` types are actually correct** (snake_case) and should be adopted rather than changed. The real pitfall is that developers see three type systems and try to unify them incorrectly:
- **Mistake A:** Make WASM-facing objects camelCase → breaks serde deserialization (Rust expects snake_case)
- **Mistake B:** Make domain types snake_case → breaks frontend convention and every component that reads `.currentAge`
- **Mistake C:** Merge all into one type → one naming convention must win, breaking something

**Why it happens:**
The three hierarchies evolved independently. Frontend types use JavaScript convention (camelCase), Rust uses its convention (snake_case), and YAML types were copy-pasted from frontend types. There was never a deliberate decision about how the WASM boundary should behave — it defaults to Rust naming because `serde-wasm-bindgen` passes field names through as-is.

**How to avoid:**
- **Consolidate frontend domain types** (`Person`, `Account`, `PlanAssumptions`) into `types/domain.ts` — camelCase, purely frontend. This is safe.
- **Consolidate YAML types** into the same `types/domain.ts` — they're identical to Person, just duplicated.
- **Keep WASM-facing types** in `types/household.ts` as snake_case — they are CORRECT as-is. Add a JSDoc comment: `/** Fields use snake_case to match Rust serde serialization. Do NOT rename to camelCase. */`
- **Keep the mapping explicit** in `useProjection.ts` — domain→WASM conversion happens here and should be clearly commented.
- **The only exception:** `SimpleProjection` return values from WASM use camelCase (because `calculations.rs` has `#[serde(rename_all = "camelCase")]`). Document this as a special case.

**Warning signs:**
- WASM calls throwing "Failed to parse..." or "missing field" errors after a "simple" type rename
- `household.ts` types being "corrected" to camelCase
- A single unified type file containing both `currentAge` and `current_age` fields

**Phase to address:**
Phase that consolidates types. Must be done before context decomposition (contexts will import from the new types location).

---

### Pitfall 6: Tests Written Against Implementation Details

**What goes wrong:**
When adding tests to an untested codebase, the natural first instinct is to test `usePeopleManagement` by asserting that `addPerson` adds an item with `Date.now().toString()` as ID. This tests the implementation, not the behavior. When `Date.now()` is replaced with `crypto.randomUUID()` (a planned fix), the test breaks despite the behavior being correct.

Similarly, testing `formatCurrency` by asserting exact string output like `"$100,000"` is fragile — `toLocaleString('en-CA')` output depends on the Node.js version and locale configuration of the test runner.

The WASM dependency makes this worse: `SummaryCard` and `GoalsCard` call `getCalculator()` directly. Testing these components requires mocking the WASM module. Mocks become tightly coupled to function signatures that are changing during this refactor.

**Why it happens:**
Brownfield test suites tend to test "does this code do what the code does" rather than "does this feature work correctly." The implementation is the only specification available.

**How to avoid:**
- **Test behavior, not implementation:**
  - `usePeopleManagement`: test "adding a person increases count by 1" and "each person has a unique ID", NOT "ID equals Date.now().toString()"
  - `formatCurrency`: test "output contains the number" and "output has thousand separators", NOT exact string match. Or: set a fixed locale in tests and accept the coupling.
  - `yaml-utils`: test round-trip (export -> import produces equivalent data), NOT exact YAML string format
- **Mock at the right boundary:**
  - Don't mock `getCalculator` directly in component tests. Instead, mock at the `useProjection` level (provide fake `calculateProjection` via context/props)
  - Or: extract WASM-dependent logic into a utility that takes the calculator as a parameter
- **What to test first (highest value, lowest coupling):**
  1. `yaml-utils` round-trip tests (pure functions, no dependencies)
  2. `usePeopleManagement` state transitions (needs only jsdom + localStorage mock)
  3. Rust calculation functions (already partially done, extend coverage)
  4. WASM bridge integration tests (verify serde round-trip with real WASM)
- **What to skip initially:**
  - Component rendering tests for SummaryCard/GoalsCard (will change with shared hook extraction)
  - Tests that assert exact CSS class names or inline styles (animation refactor will change these)
  - Snapshot tests of any kind (every refactor breaks snapshots)

**Warning signs:**
- Tests asserting exact string output from locale-dependent functions
- Component tests that mock more than 2 modules
- Test files that need updating after a "rename variable" refactor

**Phase to address:**
Testing infrastructure phase. Must be established BEFORE other refactoring begins so tests can validate each change.

---

### Pitfall 7: WASM Cache Busting on GitHub Pages

**What goes wrong:**
The WASM file is loaded via a hardcoded path: `init('/wasm/retirement_core_bg.wasm')` (wasm-loader.ts:12). The file sits in `frontend/public/wasm/` — Vite copies `public/` files to `dist/` without fingerprinting. After a deploy, users with cached JS from the previous deploy fetch the old WASM binary while the new JS bindings expect different WASM exports. Result: `LinkError` or `TypeError: calculator.calculate_yearly_projections is not a function`.

GitHub Pages sets `Cache-Control: max-age=600` on assets, but browsers also use heuristic caching for `.wasm` files. The failure is silent until the user hits a WASM call.

**Why it happens:**
Vite fingerprints JS/CSS bundles automatically but NOT files in `public/`. WASM is treated as a static asset. The deploy workflow copies the WASM to `public/wasm/` with a fixed filename.

**How to avoid:**
- **Option A (recommended):** Move the WASM file from `public/wasm/` to `src/assets/` and import it as a URL:
  ```ts
  import wasmUrl from '@/assets/retirement_core_bg.wasm?url'
  await init(wasmUrl)
  ```
  Vite fingerprints `[hash].wasm` automatically. This requires the WASM to be available at build time (it already is in CI).
- **Option B (query param):** Keep the file in `public/` but append a hash via Vite's `define` config injected from CI.
- Also add a `404.html` that redirects to `index.html` for SPA routing on GitHub Pages.
- Add a CI verification step that confirms WASM is fingerprinted in `dist/assets/`.

**Warning signs:**
- WASM file in `public/` directory (Vite doesn't fingerprint public assets)
- Hardcoded `/wasm/retirement_core_bg.wasm` path in source code
- No `.wasm` files in `dist/assets/` after build

**Phase to address:**
Deployment phase — but the `wasm-loader.ts` change must be done in the same phase that moves the WASM out of `public/`.

---

### Pitfall 8: Refactoring Scope Creates Unverifiable Changes

**What goes wrong:**
This project has 26+ active requirements spanning types, state management, components, testing, validation, deployment, and Rust code. If tackled in the wrong order, changes cascade:
- Consolidating types changes imports in 15+ files simultaneously
- Extracting shared `NumberInput` changes PersonForm.tsx and AccountCard.tsx
- Decomposing App.tsx changes every tab component's prop interface
- Adding context providers changes how every component accesses state

If type consolidation and context decomposition happen in parallel, every file touched by one refactor is also touched by the other. The diff becomes enormous and unverifiable.

**Why it happens:**
"These are all improvements, so let's do them together." But each change invalidates the testing surface for the others. The codebase currently has zero tests, so there's no regression safety net.

**How to avoid:**
- **Establish tests FIRST** for the parts that won't change (yaml-utils, usePeopleManagement state transitions, Rust calculations).
- **Batch changes by impact radius:**
  - Phase 1: Quick fixes that change 1-2 files (hardcoded year, rates, ID generation, try/catch, remove stale files)
  - Phase 2: Shared extractions that DON'T change interfaces (extract NumberInput, formatCurrency, animation CSS, goal calculation hook)
  - Phase 3: Type consolidation — changes imports everywhere but NOT logic
  - Phase 4: Context decomposition — the big structural change, done after types are stable
  - Phase 5: Validation and error boundaries — adds new code paths without changing existing ones
  - Phase 6: Testing expansion and deployment
- **Never have more than one "structural" change in flight at a time.**

**Warning signs:**
- A PR that modifies more than 10 files
- Changes to the same file from multiple concurrent refactoring branches
- "Let me just also fix X while I'm in this file"

**Phase to address:**
This is the roadmap structure itself — the pitfall is in the planning, not in any single phase.

---

### Pitfall 9: localStorage Has No Schema Versioning — Type Changes Silently Break User Data

**What goes wrong:**
`usePeopleManagement.ts:39-48` does `JSON.parse(saved)` with no version check. The YAML export format includes `version: '1.0'` (yaml-utils.ts), but localStorage does not. When any type changes happen during refactoring — adding new fields, renaming properties, changing defaults — existing user data in localStorage silently deserializes into wrong shapes:

- A `Person` type that gains a new required field `withdrawalRate` will deserialize from localStorage as `undefined` for that field
- Renaming `currentAge` to `age` means every stored person loses their age
- Adding a new `Account` type means existing plans have no accounts until the user manually adds them
- The app doesn't crash — it just shows wrong numbers, which is worse than crashing

**Why it happens:**
localStorage is treated as a simple key-value store with no migration strategy. The YAML export was given a version field but localStorage was not. During active refactoring, developers focus on the type changes and forget that real users have data in the old format.

**How to avoid:**
- Add a `SCHEMA_VERSION` constant and store it alongside data: `{ version: 1, data: ... }`
- On load, check version. If missing or lower, run migration functions:
  ```
  migrateV0toV1(data): add default withdrawalRate to each person
  migrateV1toV2(data): rename currentAge → age
  ```
- Migration functions must be pure, tested, and never lose data
- Add a fallback: if migration fails, clear localStorage and show "settings reset" message
- Write migration tests BEFORE making type changes (test-driven migration)

**Warning signs:**
- Type definitions changing without a corresponding localStorage migration
- `JSON.parse` without version checking
- New required fields added to types without default fallbacks in deserialization
- Users reporting "my data disappeared" after an update

**Phase to address:**
MUST be addressed before ANY type consolidation or type shape changes. This is foundational infrastructure.

---

### Pitfall 10: Context Provider Initialization Order Causes Stale Reads

**What goes wrong:**
`portfolioPersonId` in App.tsx:47-58 reads from `localStorage.getItem('people')` during state initialization to find the first person's ID. After decomposition into contexts, if `portfolioPersonId` state initializes before `PeopleContext` loads its data from localStorage, it reads stale/missing data. The initialization order of React context providers is deterministic (tree order), but the order in which `useState` initializers run within each provider depends on hook call order — which can change during refactoring.

More concretely: if App.tsx becomes:
```tsx
<PeopleProvider>     {/* reads people from localStorage */}
  <AssumptionsProvider>
    <AppContent>     {/* needs people[0].id for portfolioPersonId */}
```
Then `AppContent`'s `useState` initializer runs AFTER `PeopleProvider`'s `useState`. But if `portfolioPersonId` is still initialized in `AppContent` by reading `localStorage.getItem('people')` directly (bypassing the context), it's doing the same read twice with no guarantee they produce the same result.

**Why it happens:**
React's context system doesn't provide "context is ready" signals. The current code inlines everything in App.tsx, so all state initializers run in a known order. Decomposition breaks this implicit ordering.

**How to avoid:**
- `portfolioPersonId` should NOT read localStorage directly. It should derive from the `people` array provided by PeopleContext.
- Use `useEffect` or a lazy initializer that depends on the context value: `const [portfolioPersonId, setPortfolioPersonId] = useState<string | null>(null)` then set it in `useEffect` when people loads.
- Document initialization dependencies explicitly: "portfolioPersonId depends on people being loaded."
- Alternative: derive it on every render instead of storing as state: `const defaultPersonId = people[0]?.id ?? null`

**Warning signs:**
- `useState(() => ...)` initializers that read `localStorage.getItem('people')` appearing in multiple contexts
- "Cannot read property 'id' of undefined" errors on fresh installs
- Context providers whose initializers depend on other contexts' localStorage state

**Phase to address:**
Context decomposition phase — must be part of the provider tree design, not discovered during implementation.

---

## Moderate Pitfalls

### Pitfall 11: NumberInput Extraction Creates Subtle Behavior Differences

**What goes wrong:**
The two NumberInput implementations differ in details:
- `PersonForm.tsx` NumberInput (line 7): accepts `step` prop, has `px-2.5 py-1.5 pr-7` padding, full autofill CSS with `transition` and `background-image` properties
- `AccountCard.tsx` NumberInput (line 5): has `step?` (optional), `px-2 py-1 pr-6` padding, simpler autofill CSS without transition

Merging into one component means choosing one behavior. If the shared component drops the `step` prop, PersonForm breaks. If it uses PersonForm padding, AccountCard looks different.

**Prevention:**
- The shared component MUST accept `step` (required prop, not optional)
- Accept a `className` prop for padding/size overrides
- Move the autofill CSS to a shared stylesheet, not into the component
- Test both usage sites render identically after extraction

**Phase to address:** Shared component extraction phase

---

### Pitfall 12: Error Boundaries That Catch Too Much or Too Little

**What goes wrong:**
Error boundaries only catch errors during rendering, lifecycle methods, and constructors. They do NOT catch errors in event handlers, async code, or `useEffect`. The WASM init happens in a `useEffect` — so an error boundary around the Projections tab WON'T catch WASM init failure.

If the error boundary wraps too broadly (entire App), a WASM init failure crashes everything. If too narrow (individual components), the boundary catches rendering errors but misses the async WASM failure entirely.

**Prevention:**
- Place error boundaries at the TAB level (around `renderTab()` output)
- Add a SEPARATE error boundary around the app shell (Header + Tabs)
- Handle WASM init failure explicitly: `useProjection` should expose an `error` state, and tabs should show an error message when WASM fails — this is a loading state concern, not an error boundary concern
- Never rely on error boundaries for async failures — use explicit error state

**Phase to address:** Error boundary + WASM loading UI phase

---

### Pitfall 13: Duplicate `useEffect` Writes to localStorage on Every State Change

**What goes wrong:**
`saveToLocalStorage` (App.tsx:78-94) is wrapped in `useCallback` with dependencies on `[people, expectedReturn, inflationRate, showRealValues, replacementRate, withdrawalRate]`. Every time any of these values changes, localStorage is rewritten. But `people` is an array — if any property of any person changes, the entire array is a new reference. The function writes 8+ keys even when only one value changed.

During refactoring, this pattern gets duplicated: each context gets its own `useEffect` writing its slice. Instead of 8 writes per change, you get 8 writes per change PER CONTEXT.

**Prevention:**
- Centralize persistence in ONE place (single `useEffect` or a debounced write)
- Consider debouncing localStorage writes (e.g., write at most once per 500ms)
- After context decomposition, the persistence hook should read from all contexts and write in a single batch

**Phase to address:** Context decomposition phase

---

### Pitfall 14: The `realProjectionData` Redundant Computation

**What goes wrong:**
`projectionData` (line 120-123) computes projections with `showRealValues` flag. `realProjectionData` (line 133-142) computes the same projection with `showRealValues=true`. When `showRealValues` is already `true`, these compute identical data. During refactoring, developers see "redundant computation" and try to optimize by merging them. But `currentProjectionData` (line 131) switches between `projectionData` and `individualProjectionData` based on `portfolioView`, while `realProjectionData` always uses real values. They serve different purposes.

**Prevention:**
- Don't optimize the projection computation during this refactor. The redundancy is intentional.
- IF optimizing later, compute projections ONCE with nominal values and derive real values by dividing by `inflationFactor` in the consumer.

**Phase to address:** Not this project's priority. Flag as a future optimization.

---

### Pitfall 15: The `useLocalStorage` Hook Is a Trap

**What goes wrong:**
The codebase contains `useLocalStorage.ts` — a generic hook that reads and writes to localStorage. It writes to localStorage on mount in a `useEffect` even if nothing changed. During context decomposition, a developer might adopt this hook to replace the manual `saveToLocalStorage` calls. This creates a dual-write problem: the existing persistence logic in App.tsx writes `people`, `expectedReturn`, etc., and `useLocalStorage` ALSO writes the same keys on mount. localStorage gets double-writes on every state change.

Additionally, `useLocalStorage` lacks:
- Quota error handling (`localStorage.setItem` throws when storage is full)
- Schema versioning (ties into Pitfall 9)
- Debouncing (writes on every state update)

**Prevention:**
- Do NOT adopt `useLocalStorage` as-is during refactoring.
- If adopting a persistence hook, it must: (a) be the SINGLE writer for each key, (b) debounce writes, (c) handle quota errors, (d) support schema versioning.
- Mark `useLocalStorage.ts` as deprecated or delete it to prevent accidental adoption.
- Alternatively, enhance it properly before use: add debounce, quota handling, version check, and ensure it's the sole writer.

**Phase to address:** Context decomposition phase — decide the persistence strategy before splitting state.

---

### Pitfall 16: `crypto.randomUUID()` May Not Exist in Test Environments

**What goes wrong:**
The planned fix for `Date.now().toString()` IDs is to use `crypto.randomUUID()`. This is available in all modern browsers but NOT in jsdom (Vitest's default environment). Tests that call `addPerson()` or `addAccount()` will throw `TypeError: crypto.randomUUID is not a function`.

The fix requires either: (a) adding `crypto.randomUUID` polyfill to Vitest setup, or (b) using `--environment happy-dom` which has broader Web API support, or (c) injecting an ID generator function that can be mocked in tests.

**Prevention:**
- Add to `vitest.setup.ts`: `if (!globalThis.crypto?.randomUUID) { globalThis.crypto = { randomUUID: () => Math.random().toString(36).slice(2) }; }` or similar polyfill.
- Or: extract ID generation into an injectable function: `const generateId = () => crypto.randomUUID()` and mock it in tests.
- Verify test setup works BEFORE changing the ID generation in production code.

**Phase to address:** Testing infrastructure phase — must be resolved before writing tests that touch ID generation.

---

## Minor Pitfalls

### Pitfall 17: Inline Animation Styles Become Invisible When Moved to CSS

**What goes wrong:**
Nine components use `style={{ animation: 'fadeInUp 0.5s ease-out forwards', opacity: 0 }}`. When moving to a CSS class, the `@keyframes fadeInUp` definition must exist in a loaded stylesheet. Currently defined in `App.css`. If the CSS class is in a new utility file without importing the keyframe, animations silently disappear.

Also: the inline `opacity: 0` is critical. Without it, elements flash visible then animate from opacity 0.

**Prevention:** Move both `@keyframes fadeInUp` and the animation class to the same utility stylesheet. Include `opacity: 0` in the initial state. Test with `prefers-reduced-motion: reduce`.

**Phase to address:** CSS/animation cleanup phase

---

### Pitfall 18: `formatCurrency` Consolidation Changes Number Display

**What goes wrong:**
Three different formatting behaviors exist:
- `usePeopleManagement.ts:formatCurrency` — `toLocaleString('en-CA')` with default fraction digits
- `GrowthChart.tsx:formatCurrency` — `toLocaleString('en-CA', { notation: 'compact' })` for $1.2M display
- 19 inline calls — `{ minimumFractionDigits: 0, maximumFractionDigits: 0 }`

Consolidating into one utility will change some number displays. `formatCurrency(100000)` returning `"100,000"` vs `"100,000.00"` is a visible difference.

**Prevention:** Create TWO functions: `formatMoney(value)` for full display (no decimals) and `formatCompactMoney(value)` for chart display. Replace the 19 inline calls with `formatMoney`.

**Phase to address:** Shared utility extraction phase

---

### Pitfall 19: Testing WASM-Dependent Hooks Without Real WASM Binary

**What goes wrong:**
`useProjection.ts` calls `getCalculator()` which returns the WASM module. Testing this hook in Vitest without the actual WASM binary requires mocking. But the mock must accurately represent what WASM returns — including the snake_case field names and the specific `SimpleProjection` structure (which uses camelCase due to `rename_all`). A mock that uses the wrong naming convention passes tests but doesn't match production behavior.

The problem compounds: Rust types can change during this project. If `models.rs` gains a field, the WASM output changes, but the mock doesn't update unless someone remembers. This is exactly the mismatch that Pitfall 3 (WASM binding drift) describes, but at the test level.

**Prevention:**
- **Option A (recommended):** Generate mock types from the actual WASM TypeScript definitions. If `retirement_core.d.ts` exports a type, import it in the mock rather than hand-writing it.
- **Option B:** Create a shared mock factory that's verified against the WASM output in an integration test. The integration test calls WASM with known input and asserts the mock factory produces the same shape.
- **Option C:** Use the real WASM binary in tests via `vitest.config.ts` setup that initializes WASM before tests. This is the most reliable but requires the WASM to be pre-built.
- Whatever approach, add a comment in the mock: "This must match the actual WASM output shape. See calculations.rs SimpleProjection and models.rs."

**Phase to address:** Testing infrastructure phase — establish the WASM mocking strategy before writing projection-related tests.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `household.ts` types as-is (snake_case) | Avoid touching WASM boundary during type consolidation | Types look "wrong" to JS developers but are actually correct | Acceptable — add JSDoc `@note` explaining why snake_case is correct |
| Keep `useLocalStorage` hook unused | Don't risk breaking persistence during context refactor | Dead code, inconsistent patterns | Until context decomposition is done, then evaluate or delete |
| Don't optimize redundant projection calculations | Avoid introducing bugs during structural refactor | Extra WASM calls on every render | Acceptable for now — optimize in a dedicated phase |
| Manual testing instead of automated tests | Faster to start refactoring | No regression safety net | ONLY during Phase 1 quick fixes — tests must exist before structural changes |
| Skip WASM integration tests | Avoid test infrastructure complexity for WASM in CI | Type mismatches only caught at runtime | NOT acceptable — WASM bridge tests are high value |
| Skip localStorage migration for small type changes | Avoid over-engineering for a "simple rename" | Existing user data silently breaks on next visit | NEVER acceptable — any type shape change needs migration |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| serde-wasm-bindgen (Rust to JS) | Assuming serde auto-converts to camelCase — most structs use snake_case in both Rust AND JS | serde-wasm-bindgen passes field names through as-is. Only `SimpleProjection` has explicit `rename_all = "camelCase"`. Use snake_case for most WASM objects. `household.ts` types are correct. |
| Vite + WASM in `public/` | Expecting Vite to fingerprint `public/` assets | Vite only fingerprints imported assets — move WASM to `src/assets/` or use query param |
| GitHub Pages SPA | Assuming server-side routing works | Must have `404.html` redirect or use hash-based routing |
| localStorage + React state | Reading in `useState` initializer but writing in `useEffect` — stale reads on concurrent renders | Read once in initializer, write consistently in a single persistence hook |
| js-yaml `load()` | Using `as Type` assertion on parsed result | Validate structure at runtime before type assertion |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Context value not memoized | Every consumer re-renders on any state change in the context | Wrap context value in `useMemo` with correct dependencies | Immediately if `value={state}` instead of `value={useMemo(...)}` |
| `people.flatMap(...)` creates new array every render | `projectionData` useMemo recalculates because `allAccounts` is a new array reference | Derive `allAccounts` inside the useMemo that uses it, or memoize separately | When people state changes even if accounts didn't |
| `useEffect` fires on every state change writing localStorage | UI jank on rapid input changes (typing in number fields) | Debounce localStorage writes | When user types quickly in input fields |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| YAML import with `as` type assertion | Malformed YAML corrupts app state | Runtime validation of all imported fields before accepting |
| No localStorage quota error handling | `setItem` throws, entire app crashes | Wrap all `localStorage.setItem` in try/catch |
| Numeric inputs accept any value | Negative ages, Infinity balances produce nonsensical projections | Validate ranges at input and at state mutation boundaries |

## "Looks Done But Isn't" Checklist

- [ ] **Context decomposition:** Often missing — persistence hook that coordinates writes across all contexts
- [ ] **Type consolidation:** Often missing — updating yaml-utils.ts to import from types/ instead of duplicating
- [ ] **WASM cache busting:** Often missing — `404.html` for GitHub Pages SPA routing
- [ ] **Error boundaries:** Often missing — explicit WASM error state (not just error boundary for rendering)
- [ ] **NumberInput extraction:** Often missing — one usage site still using old local implementation
- [ ] **formatCurrency consolidation:** Often missing — the 19 inline `toLocaleString` calls not all replaced
- [ ] **WASM binding update:** Often missing — `retirement_core.d.ts` type wrappers still using `any`
- [ ] **Testing infrastructure:** Often missing — vitest config for WASM module mocking in tests
- [ ] **ID generation fix:** Often missing — `Date.now()` replaced in `addPerson` but not in `addAccount`
- [ ] **localStorage dead writes:** Often missing — `person_IDX_field` keys still being written but never read
- [ ] **localStorage schema version:** Often missing — `usePeopleManagement` reads localStorage without version check
- [ ] **Context init order:** Often missing — `portfolioPersonId` still reads localStorage directly instead of deriving from PeopleContext
- [ ] **useLocalStorage cleanup:** Often missing — dead hook still exists and could be adopted by mistake
- [ ] **crypto.randomUUID polyfill:** Often missing — tests fail because jsdom doesn't have `crypto.randomUUID`
- [ ] **WASM mock accuracy:** Often missing — test mocks use wrong field naming (camelCase vs snake_case) for WASM objects

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| localStorage split across contexts | MEDIUM | Revert to single persistence hook, merge state back |
| WASM binding mismatch | LOW | Rebuild WASM, re-copy all 3 files, verify with typecheck |
| Type consolidation broke WASM | MEDIUM | Revert types to original locations, keep domain types separate from WASM types |
| Tests coupled to implementation | LOW | Rewrite tests to assert behavior not implementation |
| Context decomposition too deep | HIGH | Consider PlanContext combining People + Assumptions instead of separate contexts |
| WASM cache serving stale file | LOW | Deploy with new hash, users auto-update on next visit |
| localStorage migration missing | HIGH | Write migration for all schema changes, deploy with version bump, users auto-migrate on next load |
| Context init order stale reads | LOW | Derive portfolioPersonId from context instead of direct localStorage read |
| useLocalStorage dual writes | LOW | Remove the hook, keep single persistence mechanism |
| WASM mock naming mismatch | LOW | Update mock to use snake_case (matching actual WASM output) |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Context splits localStorage | Context decomposition | Single `usePersistence` hook writes all keys atomically |
| Cross-context derived state | Architecture design | Provider tree documented, max 3 levels deep |
| WASM binding mismatch | Rust correctness fix | CI step verifies bindings match WASM |
| YAML import corruption | Validation phase | Tests with malformed YAML files |
| Type consolidation confusion | Type consolidation | `npm run typecheck` + manual WASM call test with snake_case |
| Tests coupled to implementation | Testing infrastructure | Tests survive type rename refactoring |
| WASM cache busting | Deployment | `dist/assets/` contains hashed `.wasm` file |
| Scope creates unverifiable changes | Roadmap planning | No PR modifies more than 10 files |
| localStorage no schema version | BEFORE type changes | Migration tests pass with old-format data |
| Context init order stale reads | Context decomposition | `portfolioPersonId` derived from context, not localStorage |
| NumberInput behavior divergence | Shared extraction | Visual comparison at both usage sites |
| Error boundary misses async errors | Error boundary phase | WASM failure shows error state, not white screen |
| localStorage writes on every render | Context decomposition | Debounced or batched persistence |
| realProjectionData redundancy | Future optimization | NOT this refactor's concern |
| useLocalStorage hook trap | Context decomposition | Dead hook deleted or properly enhanced |
| crypto.randomUUID polyfill | Testing infrastructure | Tests pass in jsdom environment |
| formatCurrency consolidation | Shared utility extraction | Two functions: `formatMoney` + `formatCompactMoney` |
| WASM mock accuracy | Testing infrastructure | Mock matches actual WASM output shape |

## Sources

- React official docs: Context decomposition patterns (react.dev/reference/react/useContext, react.dev/learn/scaling-up-with-reducer-and-context) — HIGH confidence
- React official docs: Error boundaries (react.dev/reference/react/Component) — HIGH confidence
- Vitest documentation: Configuration, mocking strategies (vitest.dev) — HIGH confidence
- serde-wasm-bindgen behavior: field names pass through as-is (snake_case in Rust → snake_case in JS). Only structs with explicit `#[serde(rename_all = "camelCase")]` produce camelCase in JS. Verified by inspecting `models.rs` (no rename_all) and `calculations.rs` (SimpleProjection has rename_all) and `useProjection.ts:75` (`p.total_net_worth` snake_case) — HIGH confidence
- Vite documentation: `public/` directory not fingerprinted, `?url` import for asset hashing — HIGH confidence
- MDN: `crypto.randomUUID()` browser support — all modern browsers, NOT available in jsdom — HIGH confidence
- localStorage API: quota limits, error handling — HIGH confidence
- Codebase analysis: App.tsx, usePeopleManagement.ts, useProjection.ts, yaml-utils.ts, wasm-loader.ts, useLocalStorage.ts, calculations.rs, models.rs, household.ts — directly inspected — HIGH confidence

---
*Pitfalls research for: Retire, Eh? codebase quality remediation*
*Researched: 2026-04-13*
