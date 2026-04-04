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
});
