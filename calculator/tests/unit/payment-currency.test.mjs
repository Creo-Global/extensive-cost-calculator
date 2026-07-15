import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const paymentIntegration = require('../../../CostCalculator-payment.js');

const sampleRates = {
  base: 'AED',
  rates: {
    AED: 1,
    USD: 0.272294,
    GBP: 0.203409,
  },
  bufferPct: 1.5,
  fetchedAt: '2026-07-15T13:00:00.000Z',
  expiresAt: Date.now() + 60000,
  source: 'test',
  loading: false,
  error: '',
};

describe('payment currency helpers', () => {
  it('normalizes supported currency codes', () => {
    expect(paymentIntegration.normalizeCurrencyCode('usd')).toBe('USD');
    expect(paymentIntegration.normalizeCurrencyCode('gbp')).toBe('GBP');
    expect(paymentIntegration.normalizeCurrencyCode('eur')).toBe('AED');
  });

  it('converts AED setup fee to USD with buffer applied', () => {
    const converted = paymentIntegration.convertFromAed(12520, 'USD', sampleRates);
    expect(converted).toBe(3357.98);
  });

  it('formats converted currency amounts for display', () => {
    const formatted = paymentIntegration.formatCurrencyAmount(12520, 'GBP', sampleRates);
    expect(formatted).toContain('£');
    expect(formatted).toContain('2,508.48');
  });

  it('includes currency and amount_aed on secure payment request', () => {
    const req = paymentIntegration.buildSecurePaymentRequest({
      orderId: '20260101120000123456',
      amountAed: 12520,
      currency: 'USD',
      rateState: sampleRates,
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '501234567',
      businessActivitiesText: 'Activity',
      totalVisasText: 'Investor: 0, Employee: 0 (Total: 0)',
      currentUrl: 'https://example.com/page',
    });

    expect(req.currency).toBe('USD');
    expect(req.amount_aed).toBe(12520);
    expect(req.amount).toBe(3357.98);
  });

  it('keeps AED secure payment request unchanged', () => {
    const req = paymentIntegration.buildSecurePaymentRequest({
      orderId: '20260101120000123456',
      amountAed: 12520,
      currency: 'AED',
      rateState: sampleRates,
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '501234567',
      businessActivitiesText: 'Activity',
      totalVisasText: 'Investor: 0, Employee: 0 (Total: 0)',
      currentUrl: 'https://example.com/page',
    });

    expect(req.currency).toBe('AED');
    expect(req.amount).toBe(12520);
    expect(req.amount_aed).toBe(12520);
  });
});
