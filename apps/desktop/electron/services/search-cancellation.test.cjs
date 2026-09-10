const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { SearchService } = require('./search-service.cjs');

test('pathological regex remains cancellable without blocking the main thread', { timeout: 5000 }, async (t) => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'zenith-regex-test-'));
  t.after(() => fs.rm(rootPath, { recursive: true, force: true }));
  const file = path.join(rootPath, 'adversarial.txt');
  await fs.writeFile(file, 'a'.repeat(100000) + '!');
  const service = new SearchService({ getState: () => ({ rootPath }), listFiles: () => [{ path: file, relativePath: 'adversarial.txt', extension: 'txt' }] });
  t.after(() => service.dispose());
  const pending = service.text({ searchId: 'slow', query: '(a+)+$', regex: true });
  const rejected = assert.rejects(pending, { code: 'SEARCH_CANCELLED' });
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(service.cancel('slow'), true);
  await rejected;
  assert.equal(service.active.size, 0);
  assert.equal((await service.text({ searchId: 'next', query: '!' }))[0].column, 100001);
});
