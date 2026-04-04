# Calculator Payment Integration

## Files involved

- `BP-calculator.html`
- `BP-calculator.js`
- `BP-calculator.css`
- `BP-calculator-payment.js`
- `tests/helpers/calculator-harness.mjs`
- `tests/unit/payment-helpers.test.mjs`
- `tests/unit/validation.test.mjs`
- `tests/integration/payment-flow.integration.test.mjs`
- `tests/unit/calculation-golden.test.mjs`
- `tests/integration/calculator-flow.integration.test.mjs`
- `tests/fixtures/calculation-scenarios.json`
- `tests/fixtures/calculation-golden.json`

## Payment flow overview

The Webflow calculator now mirrors the TSX payment flow with browser-safe JS helpers and without changing the calculator formulas.

1. The user opens the existing payment view from `Pay For License`.
2. The payment summary is rendered as the TSX setup-fee-only flow:
   - License fee: `AED 12,500.00`
   - Innovation fee: `AED 10.00`
   - Knowledge fee: `AED 10.00`
   - Total payable: `AED 12,520.00`
3. Before payment, the calculator validates:
   - full name
   - email
   - phone
   - current country of residence
   - consent
   - payment visa limit guard (`investor + employee visas <= 6`)
4. A health check runs against the payment API.
5. A TSX-style order ID is generated and a payment session is stored in `sessionStorage`.
6. A `payment_initiated` payload is submitted with:
   - `order_id`
   - `payment_initiated`
   - `payment_type`
   - `payment_amount`
   - the related TSX payment fields carried into the Webflow payload shape
7. The secure initiate request is sent to the new backend endpoint.
8. The returned gateway form is posted with `encRequest` and `access_code`.
9. After redirect back from the payment provider, callback parameters are parsed, the stored session is restored, the result is de-duplicated, and a payment result payload is submitted.
10. A safe success / cancelled / failed modal is shown to the user, then the callback query params are removed from the URL.

## Endpoint usage

- Health:
  - `GET https://marketing.meydanfz.ae/api/payment/health`
  - `POST https://marketing.meydanfz.ae/api/payment/health` fallback if needed
- Initiate:
  - `POST https://marketing.meydanfz.ae/api/payment/initiate`
- Callback:
  - `https://marketing.meydanfz.ae/api/payment/callback`
  - used as both `redirect_url` and `cancel_url`
  - includes `return_url=<current calculator URL without query params>`

## Callback handling logic

- Callback query params are parsed with `BP-calculator-payment.js`.
- Supported result states:
  - `Success`
  - `Failure`
  - `Cancelled`
  - `Aborted`
- The callback processor restores session data from:
  - `payment_session_<order_id>`
  - `latest_payment_order_id`
- Duplicate callback processing is blocked with a session-scoped dedupe key.
- Result payloads include TSX payment fields such as:
  - `order_id`
  - `tracking_id`
  - `payment_status`
  - `payment_mode`
  - `trans_date`
  - `bank_ref_no`
  - `failure_message`
  - `status_message`
  - `card_name`
  - `currency`
  - `response_code`
  - `billing_name`
  - `billing_email`
  - `billing_tel`

## Validations added

- Contact validation now requires:
  - full name
  - email
  - phone
  - country of residence
  - consent
- Phone validation parity was tightened to the TSX minimum digit expectation.
- TSX-style phone validation blocking now handles:
  - validating state
  - invalid state
  - unvalidated-but-entered state
- Payment guards now block:
  - malformed / incomplete contact state
  - total investor + employee visas above 6
  - payment API health failures
  - duplicate in-flight submissions

## Test commands

- `npm test`
- `npm run test:unit`
- `npm run test:integration`

## Proof calculations were not changed

The calculator formulas were left in the existing cost functions and protected by the pre-existing golden fixture suite.

- Golden regression fixture:
  - `tests/unit/calculation-golden.test.mjs`
- Locked fixtures:
  - `tests/fixtures/calculation-scenarios.json`
  - `tests/fixtures/calculation-golden.json`
- Additional regression coverage still verifies:
  - step validation and reveal flow
  - numeric edge-case handling
  - no `NaN` propagation

Current verification result:

- `npm test`
- `6 passed, 22 passed`
