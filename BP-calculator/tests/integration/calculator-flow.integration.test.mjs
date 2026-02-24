import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootCalculator, seedValidContactForm } from '../helpers/calculator-harness.mjs';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Calculator Flow Integration', () => {
  let runtime;

  afterEach(() => {
    runtime?.cleanup();
    runtime = null;
  });

  it('supports forward and backward section transitions based on contact validity', async () => {
    runtime = await bootCalculator();
    const companySetupSection = runtime.document.getElementById('company-setup-section');
    const fullNameField = runtime.document.getElementById('full-name');

    expect(companySetupSection.classList.contains('hidden')).toBe(true);

    seedValidContactForm(runtime.window);
    runtime.window.updateSectionLockState();
    await wait(1200);
    expect(companySetupSection.classList.contains('hidden')).toBe(false);

    fullNameField.focus();
    fullNameField.value = '';
    fullNameField.dispatchEvent(new runtime.window.Event('input', { bubbles: true }));
    fullNameField.dispatchEvent(new runtime.window.Event('change', { bubbles: true }));
    runtime.window.updateSectionLockState();

    expect(companySetupSection.classList.contains('hidden')).toBe(true);
  });

  it('handles edge numeric inputs and rapid changes without NaN propagation', async () => {
    runtime = await bootCalculator();

    const setValue = (id, value) => {
      const element = runtime.document.getElementById(id);
      element.value = value;
      element.dispatchEvent(new runtime.window.Event('input', { bubbles: true }));
      element.dispatchEvent(new runtime.window.Event('change', { bubbles: true }));
    };

    setValue('license-duration', '');
    setValue('shareholders-range', '-2');
    setValue('investor-visa-count', '12.8');
    setValue('employee-visa-count', '999999999');
    setValue('dependency-visas', '7.8');
    setValue('applicants-inside-uae', '٣');
    setValue('applicants-outside-uae', '5000000000');

    for (let i = 0; i < 25; i += 1) {
      setValue('employee-visa-count', `${100 + i}`);
      runtime.window.calculateCosts();
    }

    const snapshot = runtime.window.getFormSnapshot();
    expect(snapshot.licenseDuration).toBe(1);
    expect(snapshot.shareholdersCount).toBe(1);
    expect(snapshot.investorVisas).toBe(0);
    expect(snapshot.dependencyVisas).toBe(7);
    expect(snapshot.applicantsInsideUAE).toBe(0);
    expect(snapshot.employeeVisas).toBe(124);
    expect(Number.isFinite(runtime.window.calculateTotalCost())).toBe(true);
  });

  it('prevents duplicate submission on rapid double-click', async () => {
    runtime = await bootCalculator();

    seedValidContactForm(runtime.window);
    runtime.window.validateContactForm = () => true;
    runtime.window.storeConfiguration = vi.fn(async () => true);
    runtime.window.getViewAnalytics = vi.fn(async () => ({ views: [] }));
    const submitToWebhookSpy = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 20);
        }),
    );
    runtime.window.submitToWebhook = submitToWebhookSpy;

    const button = runtime.document.querySelector('.get-call-btn');
    expect(button).toBeTruthy();

    button.click();
    button.click();
    await wait(50);

    expect(submitToWebhookSpy).toHaveBeenCalledTimes(1);
  });
});
