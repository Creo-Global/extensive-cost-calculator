import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyScenario, bootCalculator, calculateBreakdown } from '../helpers/calculator-harness.mjs';

const __filename = fileURLToPath(import.meta.url);
const FIXTURES_DIR = path.resolve(path.dirname(__filename), '..', 'fixtures');
const scenarios = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'calculation-scenarios.json'), 'utf8'),
).scenarios;
const golden = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'calculation-golden.json'), 'utf8'),
).scenarios;

describe('Calculator Golden Regression', () => {
  let runtime;

  beforeAll(async () => {
    runtime = await bootCalculator();
  });

  afterAll(() => {
    runtime?.cleanup();
  });

  it('matches locked output fixtures for all scenarios', () => {
    const scenarioByName = new Map(scenarios.map((scenario) => [scenario.name, scenario]));

    golden.forEach((fixture) => {
      const scenario = scenarioByName.get(fixture.name);
      expect(scenario).toBeTruthy();

      applyScenario(runtime.window, scenario);
      const breakdown = calculateBreakdown(runtime.window);

      expect({
        licenseCost: breakdown.licenseCost,
        visaCost: breakdown.visaCost,
        addonsCost: breakdown.addonsCost,
        businessActivitiesCost: breakdown.businessActivitiesCost,
        changeStatusCost: breakdown.changeStatusCost,
        totalFromComponents: breakdown.totalFromComponents,
        totalFromCalculator: breakdown.totalFromCalculator,
        renderedGrandTotalValue: breakdown.renderedGrandTotalValue,
        renderedGrandTotalText: breakdown.renderedGrandTotalText,
      }).toEqual(fixture.expected);
    });
  });
});
