import { afterEach, describe, expect, it } from 'vitest';
import { bootCalculator } from '../helpers/calculator-harness.mjs';

function encodeValue(value) {
  return Buffer.from(unescape(encodeURIComponent(value)), 'binary').toString('base64');
}

describe('Parsing And Formatting Helpers', () => {
  let runtime;

  afterEach(() => {
    runtime?.cleanup();
    runtime = null;
  });

  it('round-trips configuration encode/decode helpers', async () => {
    runtime = await bootCalculator();
    const config = {
      contact: {
        fullName: 'John Example',
        email: 'john@example.com',
        phone: '+971501234567',
      },
      license: {
        licenseType: 'fawri',
        licenseDuration: 2,
        shareholdersCount: 4,
      },
      addons: ['bank-account', 'vat-registration'],
    };

    const encoded = runtime.window.encodeConfigurationToBase64(config);
    const decoded = runtime.window.decodeConfigurationFromBase64(encoded);

    expect(decoded).toEqual(config);
    expect(runtime.window.decodeConfigurationFromBase64('this-is-not-base64')).toBeNull();
  });

  it('safely decodes URL client and salesperson parameters', async () => {
    const client = encodeValue('Client User,client@example.com,+971500000001,C-001');
    const sales = encodeValue('Sales Person,sales@example.com,+971500000002');
    runtime = await bootCalculator();
    runtime.window.history.replaceState(
      {},
      '',
      `/?Client=${encodeURIComponent(client)}&SalesPerson=${encodeURIComponent(sales)}`,
    );

    const parsed = runtime.window.parseURLParameters();

    expect(parsed.clientData).toEqual({
      name: 'Client User',
      email: 'client@example.com',
      phone: '+971500000001',
      clientId: 'C-001',
    });
    expect(parsed.salesData).toEqual({
      name: 'Sales Person',
      email: 'sales@example.com',
      phone: '+971500000002',
    });
    expect(runtime.window.decodeBase64('!!invalid!!')).toBe('');
  });

  it('formats grand total consistently as AED currency with two decimals', async () => {
    runtime = await bootCalculator();

    runtime.window.updateGrandTotal(1234567.5);

    expect(runtime.document.getElementById('total-cost-display').textContent).toBe('AED 1,234,567.50');
    const mobileTotal = runtime.document.getElementById('mobile-grand-total-price');
    expect(mobileTotal).toBeNull();
  });
});
