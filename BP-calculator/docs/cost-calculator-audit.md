# Cost Calculator Hard Audit

## Scope
- Audited implementation files:
  - `BP-calculator.html`
  - `BP-calculator.js`
  - `BP-calculator.css` (read for functional coupling only)
- Constraints respected:
  - No formula changes to calculator math.
  - No copy/content changes.
  - No style changes except where code safety required.

## A) Inventory Map

### Entry points / UI shell
- `BP-calculator.html`
  - Contact entry fields: `#full-name`, `#phone`, `#email`, `#consent-checkbox` (lines 21, 28, 35, 41)
  - Contact progression trigger: `#submitBtn` (line 51)
  - Hidden state inputs for pricing: `#license-type`, `#license-duration`, `#shareholders-range`, `#investor-visa-count`, `#employee-visa-count`, `#dependency-visas`, `#applicants-inside-uae`, `#applicants-outside-uae` (lines 172-174, 349-351, 398-399)
  - Summary outputs: `#total-cost-display` (line 688)
  - Submit/share actions: `.get-call-btn`, `#share-btn` (lines 702, 690)

### State / interaction orchestration
- `BP-calculator.js`
  - Calculator init + global guards: `initializeCalculator` (line 85)
  - Core state: `selectedActivities`, cost components, form gating, section interactions
  - Contact/form validation model: `FormValidator` class (line 307)
  - Section lock/reveal progression: `initializeSectionLocking` (line 4484), `validateContactForm` (line 4512)
  - Live recalculation wiring: `setupLiveCalculations` (line 1183)

### Calculation modules
- `BP-calculator.js`
  - Snapshot extraction/sanitization: `getFormSnapshot` (line 3022)
  - Cost components:
    - `calculateLicenseCost` (line 3131)
    - `calculateVisaCost` (line 3102)
    - `calculateAddonsCost` (line 3047)
    - `calculateBusinessActivitiesCost` (line 3182)
    - `calculateChangeStatusCost` (line 3097)
  - Aggregation + render:
    - `calculateCosts` (line 3607)
    - `calculateTotalCost` (line 3668)

### Validation / parsing / formatting
- `BP-calculator.js`
  - Contact validation pathways: `FormValidator`, `validateContactForm`
  - URL parsing: `parseURLParameters` (line 4832)
  - Sharing encode/decode: `encodeConfigurationToBase64` (line 5164), `decodeConfigurationFromBase64` (line 5178)
  - Currency display formatter: `updateGrandTotal`

### API calls / sharing / tracking
- `BP-calculator.js`
  - Supabase client guard: `hasSupabaseClient` (line 1363)
  - Activity query flows:
    - modal search: `searchActivitiesInModal` (line 1700)
    - modal category fetch: `fetchActivitiesForModal` (line 1806)
    - global activity search dropdown: `searchActivities` (line 6673)
  - Config persistence: `storeConfiguration` (line 5714), `loadConfiguration` (line 5771)
  - Share action: `handleShareClick` (line 5969)
  - Analytics hooks:
    - `pushToDataLayer`
    - `trackLinkView`, `updateLastViewedTimestamp`, `getViewCount`, `getViewAnalytics`

## B) Static Audit Findings + Actions

### Removed dead/unreachable code
- Removed unreachable accordion block (no matching accordion markup in HTML):
  - Deleted `initAccordion()` and related accordion resize sync logic from `BP-calculator.js`.
- Removed previously identified dead/duplicate legacy code from earlier audit pass:
  - duplicate validation block and obsolete helper functions
  - duplicate `window.getCurrentConfigId`/`window.setCurrentConfigId` definitions

### Duplicate/fragile logic addressed
- Consolidated business activity pricing logic via shared `calculateBusinessActivitiesCost(...)` usage in both summary and totals paths.
- Removed duplicate `updateGrandTotal(totalCost)` call inside `calculateCosts`.

### Unused / dead handler hardening
- Added init-idempotency guards to prevent duplicate listener binding:
  - mobile auto-scroll initialization
  - back-to-top initialization

## C) Runtime Failure Audit + Hardening

### Crash/failure containment
- Added global non-prod diagnostics:
  - `window.error` and `window.unhandledrejection` logging
  - contextual `logNonProdError(...)` instrumentation for previously silent catches
- Wrapped critical calculation path:
  - `calculateCosts()` now fail-safes to controlled total (`0`) on exception instead of hard crash.

### Async race and stale data protections
- Added request-id race guards for:
  - modal activity search
  - modal category fetch
  - global activity search dropdown
- Added Supabase availability guards (`hasSupabaseClient()`) with controlled fallback UI states instead of runtime errors.

### Double submit / rapid click protection
- Added global in-flight guard for quote submission:
  - `isQuoteSubmissionInProgress`
  - blocks duplicate concurrent submits across `.get-call-btn` handlers.

### NaN/invalid propagation safeguards
- Added numeric helpers (`toInteger`, `toMinInteger`) and applied to snapshot capture points used by calculation flow.

### Client/runtime compatibility
- Replaced JS `:has(...)` selector usage in critical paths with `closest(...)`/direct lookups for safer browser compatibility.

## D) Tests Added (Vitest + jsdom)

### Framework setup
- Added lightweight test stack:
  - `vitest`
  - `jsdom`
- Config: `vitest.config.mjs`
- Harness: `tests/helpers/calculator-harness.mjs` (boots real HTML + real calculator JS in jsdom)

### Unit tests
- `tests/unit/calculation-golden.test.mjs`
  - Locks component and aggregate outputs against golden fixtures.
- `tests/unit/parsing-formatting.test.mjs`
  - Covers configuration encode/decode, URL parsing, safe Base64 fallback, currency formatting behavior.
- `tests/unit/validation.test.mjs`
  - Covers required field enforcement, valid form pass case, forbidden-character rejection.

### Integration tests
- `tests/integration/calculator-flow.integration.test.mjs`
  - Forward/back section progression (valid -> reveal, invalid while editing -> hide)
  - Edge numeric inputs + rapid updates without NaN propagation
  - Rapid double-click submission guard (single submit execution)

### Golden fixtures (regression lock)
- Scenario definitions: `tests/fixtures/calculation-scenarios.json`
- Locked outputs: `tests/fixtures/calculation-golden.json`
- Golden fixture compares:
  - `licenseCost`
  - `visaCost`
  - `addonsCost`
  - `businessActivitiesCost`
  - `changeStatusCost`
  - `totalFromComponents`
  - `totalFromCalculator`
  - rendered grand-total text/value

## E) Edge Cases Covered
- Empty numeric values and fallback minimums
- Negative values in hidden numeric fields
- Decimal input coercion via `parseInt` behavior
- Very large numeric values
- Non-Western numeral input in numeric fields (`٣`, `١٢`)
- Rapid repeated input changes
- Rapid double-click submit path
- Invalid Base64 and malformed share parameters

## F) Proof Calculations Are Unchanged
- Regression locked by golden tests:
  - `tests/unit/calculation-golden.test.mjs`
  - `tests/fixtures/calculation-golden.json`
- Full test run result at audit completion:
  - `4` test files passed
  - `10` tests passed

## Test Commands
- `npm test`
- `npm run test:unit`
- `npm run test:integration`

## Refactors/Removals Summary
- Removed dead accordion code path and stale duplicate helpers.
- Added robust non-prod logging and controlled failure behavior.
- Added async race protection for activity search/fetch paths.
- Added init idempotency to prevent duplicate listeners.
- Added comprehensive automated unit + integration + golden regression coverage.
