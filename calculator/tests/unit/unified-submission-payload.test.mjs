import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const paymentIntegration = require('../../../CostCalculator-payment.js');

describe('unified submission payload', () => {
  it('normalizes legacy field aliases into the canonical payload', () => {
    const payload = paymentIntegration.createUnifiedSubmissionPayload({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+971500001234',
      country: 'United Arab Emirates',
      license_type: 'fawri',
      shareholders_range: 2,
      total_cost: 15020,
      order_id: 'ORD-1001',
    });

    expect(payload.fullName).toBe('Ada Lovelace');
    expect(payload.countryOfResidence).toBe('United Arab Emirates');
    expect(payload.licenseType).toBe('fawri');
    expect(payload.shareholdersCount).toBe(2);
    expect(payload.totalCost).toBe(15020);
    expect(payload.orderId).toBe('ORD-1001');
    expect(payload.trackingId).toBe('');
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('full_name');
    expect(payload).not.toHaveProperty('First_Name');
    expect(payload).not.toHaveProperty('Last_Name');
  });

  it('builds payment lifecycle payloads with the same canonical keys', () => {
    const payload = paymentIntegration.buildPaymentLifecyclePayload({
      actionType: 'payment_initiated',
      contact: {
        fullName: 'Grace Hopper',
        email: 'grace@example.com',
        phone: '+971500009999',
        country: 'United Arab Emirates',
        consent: 'Yes',
      },
      calculator: {
        licenseType: 'regular',
        shareholders: 1,
        selectedActivities: 'Software Development',
        totalCost: 12520,
        licenseCost: 12500,
        licenseDuration: '1',
      },
      payment: {
        orderId: 'ORD-2002',
        paymentInitiated: 'yes',
        paymentType: 'setup_fee',
        paymentAmount: 12520,
        formStatus: 'payment',
      },
      metadata: {
        page_url: 'https://example.com/calculator',
        submission_time: '2026-04-07T10:00:00.000Z',
      },
      form: {
        formId: 'multiStepForm',
        formName: 'Cost Calcualtor',
      },
    });

    expect(payload).toMatchObject({
      actionType: 'Payment Initiated',
      fullName: 'Grace Hopper',
      orderId: 'ORD-2002',
      trackingId: '',
      paymentInitiated: 'yes',
      paymentType: 'setup_fee',
      paymentAmount: 12520,
      formStatus: 'payment',
      formId: 'multiStepForm',
      formName: 'Cost Calcualtor',
      pageUrl: 'https://example.com/calculator',
      submissionTimestamp: '2026-04-07T10:00:00.000Z',
    });
    expect(payload).not.toHaveProperty('poweredBy');
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('First_Name');
    expect(payload).not.toHaveProperty('Last_Name');
    expect(payload).not.toHaveProperty('order_id');
    expect(payload).not.toHaveProperty('tracking_id');
  });

  it('stores payment session data with unified key names', () => {
    const session = paymentIntegration.buildPaymentSessionData({
      fullName: 'Linus Torvalds',
      email: 'linus@example.com',
      phone: '+971500002222',
      country: 'Finland',
      orderId: 'ORD-3003',
      trackingId: '',
      paymentAmount: 12520,
      paymentType: 'setup_fee',
    });

    expect(session).toEqual({
      fullName: 'Linus Torvalds',
      email: 'linus@example.com',
      phone: '+971500002222',
      country: 'Finland',
      orderId: 'ORD-3003',
      paymentAmount: 12520,
      paymentType: 'setup_fee',
      trackingId: '',
      timestamp: expect.any(String),
    });
    expect(session).not.toHaveProperty('name');
    expect(session).not.toHaveProperty('order_id');
    expect(session).not.toHaveProperty('tracking_id');
  });
});
