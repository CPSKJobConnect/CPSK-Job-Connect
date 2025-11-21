import { spawnSync } from 'child_process';
import path from 'path';
import assert from 'assert';

// This Jest test runs the scanner script and fails the test if any violations
// are detected. The scanner exits with non-zero code on violations.

test('cookie size scanner finds no violations', () => {
  const script = path.resolve(process.cwd(), 'scripts', 'check-cookie-size.mjs');
  const node = process.execPath;
  const result = spawnSync(node, [script], { stdio: 'inherit' });
  // Exit code 0 means no violations; any other code means failure
  assert.strictEqual(result.status, 0);
});
