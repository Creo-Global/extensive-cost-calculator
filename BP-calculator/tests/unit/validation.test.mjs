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

    const nameField = runtime.document.getElementById('full-name');
    nameField.value = 'محمد علي';
    nameField.dispatchEvent(new runtime.window.Event('input', { bubbles: true }));
    expect(nameField.value).toBe('محمد علي');
    expect(runtime.window.validateContactForm()).toBe(true);

    nameField.value = '123@@';
    nameField.dispatchEvent(new runtime.window.Event('input', { bubbles: true }));
    expect(nameField.value).toBe('');
    expect(runtime.window.validateContactForm()).toBe(false);
  });

  it('accepts apostrophes in names', async () => {
    runtime = await bootCalculator();
    seedValidContactForm(runtime.window);

    const nameField = runtime.document.getElementById('full-name');
    nameField.value = "O'Neil";
    nameField.dispatchEvent(new runtime.window.Event('input', { bubbles: true }));

    expect(nameField.value).toBe("O'Neil");
    expect(runtime.window.validateContactForm()).toBe(true);
    expect(runtime.window.formValidator.validateContactForm()).toBe(true);
  });
});
