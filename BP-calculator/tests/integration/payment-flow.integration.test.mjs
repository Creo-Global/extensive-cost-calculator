import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootCalculator, seedValidContactForm } from '../helpers/calculator-harness.mjs';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createJsonResponse(payload, ok = true) {
  return {
    ok,
    json: async () => payload,
  };
}

function createPaymentFetchMock({ initiateHandler, healthPayload = { status: 'healthy' } } = {}) {
  return vi.fn(async (input, init = {}) => {
    const url = String(input || '');

    if (url.includes('ipapi.co')) {
      return createJsonResponse({
        country_code: 'AE',
        country_name: 'United Arab Emirates',
        ip: '127.0.0.1',
        city: 'Dubai',
        region: 'Dubai',
        timezone: 'Asia/Dubai',
      });
    }

    if (url.includes('/api/payment/health')) {
      return createJsonResponse(healthPayload, true);
    }

    if (url.includes('/api/payment/initiate')) {
      return initiateHandler ? initiateHandler(url, init) : createJsonResponse({}, true);
    }

    return createJsonResponse({}, true);
  });
}

describe('Payment Flow Integration', () => {
  let runtime;

  afterEach(() => {
    vi.restoreAllMocks();
    runtime?.cleanup();
    runtime = null;
  });

  it('initiates the secure payment path successfully', async () => {
    const fetchMock = createPaymentFetchMock({
      initiateHandler: async () =>
        createJsonResponse({
          success: true,
          data: {
            gatewayUrl: 'https://gateway.example/pay',
            encRequest: 'encrypted-request',
            accessCode: 'access-code',
          },
        }),
    });

    runtime = await bootCalculator({ fetchImpl: fetchMock });
    runtime.window.confirm = () => true;
    vi.spyOn(runtime.window.HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

    seedValidContactForm(runtime.window);
    runtime.document.getElementById('summary-payment-submit-btn').click();
    await wait(25);

    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/payment/initiate'))).toHaveLength(1);

    const gatewayForm = runtime.document.querySelector('form[action="https://gateway.example/pay"]');
    expect(gatewayForm).toBeTruthy();
    expect(gatewayForm.querySelector('[name="encRequest"]').value).toBe('encrypted-request');
    expect(gatewayForm.querySelector('[name="access_code"]').value).toBe('access-code');
    expect(runtime.document.getElementById('summary-payment-message').textContent).toContain('Redirecting');
  });

  it('surfaces a safe error when payment initiation fails', async () => {
    const fetchMock = createPaymentFetchMock({
      initiateHandler: async () =>
        createJsonResponse({
          success: false,
          error: 'Forbidden request origin',
        }, true),
    });

    runtime = await bootCalculator({ fetchImpl: fetchMock });
    runtime.window.confirm = () => true;
    vi.spyOn(runtime.window.HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

    seedValidContactForm(runtime.window);
    runtime.document.getElementById('summary-payment-submit-btn').click();
    await wait(25);

    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/payment/initiate'))).toHaveLength(1);
    expect(runtime.document.querySelector('form[action="https://gateway.example/pay"]')).toBeNull();
    expect(runtime.document.getElementById('summary-payment-message').textContent).toContain('Payment initiation failed');
    expect(runtime.document.getElementById('summary-payment-submit-btn').disabled).toBe(false);
  });

  it('blocks payment when required fields are missing', async () => {
    const fetchMock = createPaymentFetchMock();

    runtime = await bootCalculator({ fetchImpl: fetchMock });
    runtime.window.confirm = () => true;

    runtime.document.getElementById('full-name').value = 'Test User';
    runtime.document.getElementById('email').value = 'test@example.com';
    runtime.document.getElementById('phone').value = '971501234567';
    runtime.document.getElementById('summary-payment-submit-btn').click();
    await wait(10);

    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/payment/initiate'))).toHaveLength(0);
    expect(runtime.document.getElementById('calc-error-message').textContent).toContain('Current country of residence is required');
    expect(runtime.document.getElementById('calc-consent-error').textContent).toContain('terms and privacy policy');
  });

  it('prevents duplicate payment submission while a request is in flight', async () => {
    let resolveInitiate;
    const initiatePromise = new Promise((resolve) => {
      resolveInitiate = resolve;
    });

    const fetchMock = createPaymentFetchMock({
      initiateHandler: () => initiatePromise,
    });

    runtime = await bootCalculator({ fetchImpl: fetchMock });
    runtime.window.confirm = () => true;
    vi.spyOn(runtime.window.HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

    seedValidContactForm(runtime.window);
    const button = runtime.document.getElementById('summary-payment-submit-btn');
    button.click();
    button.click();

    await wait(10);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/payment/initiate'))).toHaveLength(1);

    resolveInitiate(
      createJsonResponse({
        success: true,
        data: {
          gatewayUrl: 'https://gateway.example/pay',
          encRequest: 'encrypted-request',
          accessCode: 'access-code',
        },
      }),
    );
    await wait(20);
  });

  it('handles payment callback success safely and de-duplicates processing', async () => {
    const submitSpy = vi.fn(async () => true);

    runtime = await bootCalculator({
      url:
        'https://marketing.meydanfz.ae/business-setup-calculator' +
        '?payment_status=Success&order_id=ORD-1&amount=12520&tracking_id=TRK-1&payment_mode=Card&trans_date=2026-04-04T10%3A00%3A00Z&response_code=0',
      beforeDOMContentLoaded(window) {
        window.submitToWebhook = submitSpy;
        window.sessionStorage.setItem(
          'payment_session_ORD-1',
          JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            phone: '+971501234567',
            country: 'AE',
            order_id: 'ORD-1',
            payment_amount: 12520,
            payment_type: 'setup_fee',
          }),
        );
        window.sessionStorage.setItem('latest_payment_order_id', 'ORD-1');
      },
    });

    await wait(20);

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy.mock.calls[0][0]).toMatchObject({
      actionType: 'Payment Successful',
      order_id: 'ORD-1',
      tracking_id: 'TRK-1',
      payment_status: 'Success',
      payment_type: 'setup_fee',
    });
    expect(runtime.document.getElementById('payment-status-modal').classList.contains('show')).toBe(true);
    expect(runtime.document.getElementById('payment-status-title').textContent).toContain('Successful');
    expect(runtime.window.location.search).toBe('');
  });

  it('handles payment callback failure safely', async () => {
    const submitSpy = vi.fn(async () => true);

    runtime = await bootCalculator({
      url:
        'https://marketing.meydanfz.ae/business-setup-calculator' +
        '?payment_status=Failure&order_id=ORD-2&amount=12520&tracking_id=TRK-2&payment_mode=Card&trans_date=2026-04-04T10%3A05%3A00Z&response_code=5&failure_message=Declined',
      beforeDOMContentLoaded(window) {
        window.submitToWebhook = submitSpy;
      },
    });

    await wait(20);

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy.mock.calls[0][0]).toMatchObject({
      actionType: 'Payment Failed',
      order_id: 'ORD-2',
      tracking_id: 'TRK-2',
      payment_status: 'Failure',
      response_code: '5',
    });
    expect(runtime.document.getElementById('payment-status-title').textContent).toContain('Failed');
  });
});
