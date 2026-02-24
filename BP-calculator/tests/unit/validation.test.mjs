import { afterEach, describe, expect, it } from 'vitest';
import { bootCalculator, seedValidContactForm } from '../helpers/calculator-harness.mjs';

describe('Validation Logic', () => {
  let runtime;

  afterEach(() => {
    runtime?.cleanup();
    runtime = null;
  });

  it('enforces required contact fields and consent', async () => {
    runtime = await bootCalculator();

    runtime.document.getElementById('submitBtn').click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(runtime.window.validateContactForm()).toBe(false);
    expect(runtime.document.getElementById('calc-full-name-error').textContent).toContain('required');
    expect(runtime.document.getElementById('calc-email-error').textContent).toContain('required');
    expect(runtime.document.getElementById('calc-phone-error').textContent).toContain('required');
  });

  it('accepts a fully valid contact form', async () => {
    runtime = await bootCalculator();
    seedValidContactForm(runtime.window);

    expect(runtime.window.validateContactForm()).toBe(true);
    expect(runtime.window.formValidator.validateContactForm()).toBe(true);
  });

  it('validates multilingual names and rejects forbidden characters', async () => {
    runtime = await bootCalculator();
    seedValidContactForm(runtime.window);

    runtime.document.getElementById('full-name').value = 'محمد علي';
    expect(runtime.window.validateContactForm()).toBe(true);

    runtime.document.getElementById('full-name').value = 'John123@@';
    expect(runtime.window.validateContactForm()).toBe(false);
  });
});
