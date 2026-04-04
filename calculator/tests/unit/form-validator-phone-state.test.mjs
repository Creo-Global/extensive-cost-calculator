import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calculatorSource = fs.readFileSync(
  path.resolve(__dirname, '../../../CostCalculator.js'),
  'utf8',
);

const classStart = calculatorSource.indexOf('class FormValidator {');
const classEnd = calculatorSource.indexOf('// Initialize the validator', classStart);

if (classStart === -1 || classEnd === -1) {
  throw new Error('Unable to locate FormValidator class in CostCalculator.js');
}

const formValidatorSource = calculatorSource
  .slice(classStart, classEnd)
  .replace('class FormValidator', 'globalThis.FormValidator = class FormValidator');

function createValidator(mfzPhone) {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <input id="phone" type="tel" />
        <div id="calc-phone-error" class="calc-error-message"></div>
      </body>
    </html>
  `);

  const context = {
    window: dom.window,
    document: dom.window.document,
    globalThis: null,
    NAME_VALIDATION_REGEX: /^[a-zA-Z\s'-]+$/,
    paymentIntegration: null,
    updateSectionLockState: undefined,
    triggerFormValidationAfterProgrammaticFill: () => {},
    revealSections: () => {},
    markPreviousSectionsAsInteracted: () => {},
    calculateCosts: () => {},
    isContactFormCompleted: false,
    pricingRevealed: false,
    setTimeout: () => 0,
    clearTimeout: () => {},
    CustomEvent: dom.window.CustomEvent,
    Event: dom.window.Event,
  };

  context.globalThis = context;
  context.window.MFZPhone = mfzPhone;
  context.window.scrollTo = () => {};

  vm.createContext(context);
  vm.runInContext(formValidatorSource, context);

  return {
    dom,
    validator: new context.FormValidator(),
    phoneField: context.document.getElementById('phone'),
  };
}

function createMfzPhoneHarness() {
  const instance = {
    validationState: 'idle',
    validationMessage: '',
    iti: {
      getSelectedCountryData: () => ({ iso2: 'ae' }),
    },
  };

  return {
    instance,
    api: {
      init: vi.fn(),
      isValid: vi.fn(() => false),
      getInstance: vi.fn(() => instance),
    },
  };
}

describe('FormValidator phone validation state', () => {
  it('keeps an unchanged phone number valid while MFZPhone revalidates it', () => {
    const { instance, api } = createMfzPhoneHarness();
    const { validator, phoneField } = createValidator(api);

    phoneField.value = '050 123 4567';
    api.isValid.mockReturnValue(true);
    instance.validationState = 'valid';

    expect(validator.getPhoneValidationMeta(phoneField).validationState).toBe('valid');

    api.isValid.mockReturnValue(false);
    instance.validationState = 'validating';

    expect(validator.getPhoneValidationMeta(phoneField).validationState).toBe('valid');
  });

  it('drops the cached valid state once the user edits the phone number', () => {
    const { instance, api } = createMfzPhoneHarness();
    const { dom, validator, phoneField } = createValidator(api);

    phoneField.value = '050 123 4567';
    api.isValid.mockReturnValue(true);
    instance.validationState = 'valid';
    validator.getPhoneValidationMeta(phoneField);

    phoneField.value = '050 123 4568';
    phoneField.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    api.isValid.mockReturnValue(false);
    instance.validationState = 'validating';

    expect(validator.getPhoneValidationMeta(phoneField).validationState).toBe('validating');
  });
});
