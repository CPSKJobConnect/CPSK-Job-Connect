import { execSync } from 'child_process';

describe('text-safety scanner', () => {
  jest.setTimeout(120000);

  test('no unsafe text insertion or eval/Function usage', () => {
    try {
      execSync('node ./scripts/check-text-safety.mjs', { stdio: 'pipe' });
    } catch (err: any) {
      const out = err.stdout ? err.stdout.toString() : '';
      const errOut = err.stderr ? err.stderr.toString() : '';
      const combined = `${out}\n${errOut}`;
      // Fail the test with the scanner output to help investigation
      throw new Error('Text-safety scanner detected issues:\n' + combined);
    }
  });
});
