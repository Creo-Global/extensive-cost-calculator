import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const paymentIntegration = require('../../../CostCalculator-payment.js');

describe('payment setup fee summary', () => {
  it('uses the regular setup fee by default', () => {
    expect(paymentIntegration.createSetupFeeSummary()).toEqual({
      licenseType: 'regular',
      licenseFee: 12500,
      innovationFee: 10,
      knowledgeFee: 10,
      total: 12520,
    });
  });

  it('uses the fawri setup fee when fawri is selected', () => {
    expect(
      paymentIntegration.createSetupFeeSummary({
        licenseType: 'fawri',
      }),
    ).toEqual({
      licenseType: 'fawri',
      licenseFee: 15000,
      innovationFee: 10,
      knowledgeFee: 10,
      total: 15020,
    });
  });

  it('includes channel on secure payment request when provided', () => {
    const req = paymentIntegration.buildSecurePaymentRequest({
      orderId: '20260101120000123456',
      amount: 12833,
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '501234567',
      channel: 'tamara',
      businessActivitiesText: 'Activity',
      totalVisasText: 'Investor: 0, Employee: 0 (Total: 0)',
      currentUrl: 'https://example.com/page',
    });
    expect(req.channel).toBe('tamara');
  });

  it('omits channel on secure payment request when not provided', () => {
    const req = paymentIntegration.buildSecurePaymentRequest({
      orderId: '20260101120000123456',
      amount: 12520,
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '501234567',
      businessActivitiesText: 'Activity',
      totalVisasText: 'Investor: 0, Employee: 0 (Total: 0)',
      currentUrl: 'https://example.com/page',
    });
    expect(req.channel).toBeUndefined();
  });
});
