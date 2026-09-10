const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { WorkspaceService } = require('./workspace-service.cjs');

async function fixture(t, bytes = 'original\r\n') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'zenith-save-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'space name.txt');
  await fs.writeFile(file, bytes);
  const workspace = new WorkspaceService();
  await workspace.open(root);
  return { root, file, workspace };
}

test('safe save preserves BOM/newlines and serializes consecutive writes', async (t) => {
  const { root, file, workspace } = await fixture(t, '\uFEFForiginal\r\n');
  assert.equal(await workspace.readFile(file), 'original\r\n');
  await Promise.all([workspace.writeFile(file, 'first\r\n'), workspace.writeFile(file, 'second\r\n')]);
  assert.equal(await fs.readFile(file, 'utf8'), '\uFEFFsecond\r\n');
  assert.deepEqual(await fs.readdir(root), ['space name.txt']);
});

test('external changes and deletion never get overwritten by save', async (t) => {
  const { file, workspace } = await fixture(t);
  await workspace.readFile(file);
  await fs.writeFile(file, 'external');
  await assert.rejects(workspace.writeFile(file, 'editor'), /changed on disk/);
  assert.equal(await fs.readFile(file, 'utf8'), 'external');
  await fs.unlink(file);
  await assert.rejects(workspace.writeFile(file, 'editor'), { code: 'ENOENT' });
});

test('rejects binary, invalid UTF-8, oversized files and outside paths', async (t) => {
  const { file, workspace, root } = await fixture(t, Buffer.from([0xff, 0xfe, 0]));
  await assert.rejects(workspace.readFile(file), /Binary/);
  await fs.writeFile(file, Buffer.from([0xc3, 0x28]));
  await assert.rejects(workspace.readFile(file), /UTF-8/);
  await fs.writeFile(file, 'a'.repeat(2 * 1024 * 1024 + 1));
  await assert.rejects(workspace.readFile(file), /2 MiB/);
  await assert.rejects(workspace.readFile(path.join(root, '..', 'outside.txt')), { code: 'PATH_OUTSIDE_WORKSPACE' });
  workspace.close();
  await assert.rejects(workspace.writeFile(file, 'editor'), { code: 'NO_WORKSPACE' });
});
