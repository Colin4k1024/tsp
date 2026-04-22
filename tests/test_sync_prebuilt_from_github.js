#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const {
  buildGithubContentUrl,
  buildRefCandidates,
  isSafeTarEntryPath,
  normalizeRepositorySlug,
  parseArgs,
  planDownloads,
  readTarEntriesFromTarGz,
  syncPrebuilt,
} = require('../scripts/sync-prebuilt-from-github');

let passed = 0;
let failed = 0;

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ✓ ${name}`);
    })
    .catch((error) => {
      failed += 1;
      console.error(`  ✗ ${name}`);
      console.error(`    ${error.message}`);
    });
}

async function run() {
  console.log('GitHub prebuilt sync tests');

  function createTarEntry(name, contents) {
    const body = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
    const header = Buffer.alloc(512, 0);
    header.write(name, 0, Math.min(Buffer.byteLength(name), 100), 'utf8');
    header.write('0000777\0', 100, 8, 'ascii');
    header.write('0000000\0', 108, 8, 'ascii');
    header.write('0000000\0', 116, 8, 'ascii');
    header.write(body.length.toString(8).padStart(11, '0') + '\0', 124, 12, 'ascii');
    header.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0', 136, 12, 'ascii');
    header.fill(' ', 148, 156);
    header.write('0', 156, 1, 'ascii');
    header.write('ustar\0', 257, 6, 'ascii');
    header.write('00', 263, 2, 'ascii');

    let checksum = 0;
    for (const byte of header) {
      checksum += byte;
    }
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');

    const padding = (512 - (body.length % 512)) % 512;
    return Buffer.concat([header, body, Buffer.alloc(padding, 0)]);
  }

  function createTarGz(entries) {
    const tarEntries = entries.map((entry) => createTarEntry(entry.name, entry.contents));
    return zlib.gzipSync(Buffer.concat([...tarEntries, Buffer.alloc(1024, 0)]));
  }

  test('normalizeRepositorySlug supports git+https github urls', () => {
    assert.strictEqual(
      normalizeRepositorySlug({ url: 'git+https://github.com/Colin4k1024/tsp.git' }),
      'Colin4k1024/tsp'
    );
  });

  test('buildRefCandidates prefers explicit ref then fallback', () => {
    const refs = buildRefCandidates({ ref: 'release-test', fallbackRef: 'main' }, { version: '2.1.5' });
    assert.deepStrictEqual(refs, ['release-test', 'main']);
  });

  test('buildRefCandidates defaults to main and master fallbacks', () => {
    const refs = buildRefCandidates({ ref: 'release-test', fallbackRef: null }, { version: '2.1.5' });
    assert.deepStrictEqual(refs, ['release-test', 'main', 'master']);
  });

  test('buildGithubContentUrl encodes paths and refs', () => {
    assert.strictEqual(
      buildGithubContentUrl('https://api.github.com', 'owner/repo', 'v1.2.3', 'bin/prebuilt/darwin-arm64/oris-claude-bridge'),
      'https://api.github.com/repos/owner/repo/contents/bin/prebuilt/darwin-arm64/oris-claude-bridge?ref=v1.2.3'
    );
  });

  test('parseArgs supports ref fallback platform and dry-run', () => {
    const options = parseArgs(['node', 'script', '--ref', 'v2.1.5', '--fallback-ref', 'main', '--platform', 'darwin-arm64', 'linux-x64', '--dry-run']);
    assert.strictEqual(options.ref, 'v2.1.5');
    assert.strictEqual(options.fallbackRef, 'main');
    assert.deepStrictEqual(options.platforms, ['darwin-arm64', 'linux-x64']);
    assert.strictEqual(options.dryRun, true);
  });

  test('planDownloads prefers existing local binaries before remote fetch', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-sync-local-'));
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: '@colin4k1024/tsp', version: '2.1.4', repository: { url: 'git+https://github.com/Colin4k1024/tsp.git' } }),
      'utf8'
    );
    const binaryPath = path.join(root, 'bin', 'prebuilt', 'darwin-arm64');
    fs.mkdirSync(binaryPath, { recursive: true });
    fs.writeFileSync(path.join(binaryPath, 'oris-claude-bridge'), Buffer.from([9, 8, 7]));

    let fetchCalls = 0;
    const plan = await planDownloads({
      root,
      repo: null,
      ref: 'v2.1.4',
      fallbackRef: 'main',
      token: null,
      apiBase: 'https://api.github.com',
      platforms: ['darwin-arm64'],
      dryRun: true,
    }, {
      fetchImpl: async () => {
        fetchCalls += 1;
        throw new Error('fetch should not be called');
      },
    });

    assert.strictEqual(plan.source, 'local');
    assert.strictEqual(plan.ref, 'local');
    assert.strictEqual(fetchCalls, 0);
    assert.deepStrictEqual([...plan.downloads[0].contents], [9, 8, 7]);

    fs.rmSync(root, { recursive: true, force: true });
  });

  test('planDownloads falls back to secondary ref when primary is missing binaries', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-sync-'));
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ version: '2.1.5', repository: { url: 'git+https://github.com/Colin4k1024/tsp.git' } }),
      'utf8'
    );

    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(url);
      if (url.includes('ref=v2.1.5')) {
        return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
      }
      return { ok: true, status: 200, arrayBuffer: async () => Buffer.from('binary').buffer };
    };

    const plan = await planDownloads({
      root,
      repo: null,
      ref: 'v2.1.5',
      fallbackRef: 'main',
      token: null,
      apiBase: 'https://api.github.com',
      platforms: ['darwin-arm64'],
      dryRun: true,
    }, { fetchImpl });

    assert.strictEqual(plan.ref, 'main');
    assert.strictEqual(plan.downloads.length, 1);
    assert.ok(calls.some((url) => url.includes('ref=v2.1.5')));
    assert.ok(calls.some((url) => url.includes('ref=main')));

    fs.rmSync(root, { recursive: true, force: true });
  });

  test('planDownloads falls back to npm tarball when github refs are missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-sync-npm-'));
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: '@colin4k1024/tsp', version: '2.1.5', repository: { url: 'git+https://github.com/Colin4k1024/tsp.git' } }),
      'utf8'
    );

    const tarball = createTarGz([
      {
        name: 'package/bin/prebuilt/darwin-arm64/oris-claude-bridge',
        contents: Buffer.from([1, 2, 3, 4]),
      },
    ]);

    const fetchImpl = async (url) => {
      if (url.includes('/repos/')) {
        return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
      }
      if (url === 'https://registry.npmjs.org/%40colin4k1024%2Ftsp') {
        const integrity = `sha512-${crypto.createHash('sha512').update(tarball).digest('base64')}`;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            'dist-tags': { latest: '2.1.3' },
            versions: {
              '2.1.3': {
                dist: {
                  integrity,
                  tarball: 'https://registry.npmjs.org/@colin4k1024/tsp/-/colin4k1024-tsp-2.1.3.tgz',
                },
              },
            },
          }),
        };
      }
      if (url === 'https://registry.npmjs.org/@colin4k1024/tsp/-/colin4k1024-tsp-2.1.3.tgz') {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => tarball.buffer.slice(tarball.byteOffset, tarball.byteOffset + tarball.byteLength),
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    const plan = await planDownloads({
      root,
      repo: null,
      ref: 'v2.1.5',
      fallbackRef: 'main',
      token: null,
      apiBase: 'https://api.github.com',
      platforms: ['darwin-arm64'],
      dryRun: true,
    }, { fetchImpl });

    assert.strictEqual(plan.source, 'npm');
    assert.strictEqual(plan.version, '2.1.3');
    assert.strictEqual(plan.downloads.length, 1);
    assert.deepStrictEqual([...plan.downloads[0].contents], [1, 2, 3, 4]);

    fs.rmSync(root, { recursive: true, force: true });
  });

  test('planDownloads fails when npm tarball misses required binaries', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-sync-missing-'));
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: '@colin4k1024/tsp', version: '2.1.5', repository: { url: 'git+https://github.com/Colin4k1024/tsp.git' } }),
      'utf8'
    );

    const tarball = createTarGz([]);

    const fetchImpl = async (url) => {
      if (url.includes('/repos/')) {
        return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
      }
      if (url === 'https://registry.npmjs.org/%40colin4k1024%2Ftsp') {
        const integrity = `sha512-${crypto.createHash('sha512').update(tarball).digest('base64')}`;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            'dist-tags': { latest: '2.1.3' },
            versions: {
              '2.1.3': {
                dist: {
                  integrity,
                  tarball: 'https://registry.npmjs.org/@colin4k1024/tsp/-/colin4k1024-tsp-2.1.3.tgz',
                },
              },
            },
          }),
        };
      }
      if (url === 'https://registry.npmjs.org/@colin4k1024/tsp/-/colin4k1024-tsp-2.1.3.tgz') {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => tarball.buffer.slice(tarball.byteOffset, tarball.byteOffset + tarball.byteLength),
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    await assert.rejects(
      () => planDownloads({
        root,
        repo: null,
        ref: 'v2.1.5',
        fallbackRef: 'main',
        token: null,
        apiBase: 'https://api.github.com',
        platforms: ['darwin-arm64'],
        dryRun: true,
      }, { fetchImpl }),
      /Unable to resolve prebuilt binaries from GitHub refs v2.1.5, main or npm registry: Missing binaries in npm tarball/
    );

    fs.rmSync(root, { recursive: true, force: true });
  });

  test('isSafeTarEntryPath rejects absolute and traversal paths', () => {
    assert.strictEqual(isSafeTarEntryPath('package/bin/prebuilt/darwin-arm64/oris-claude-bridge'), true);
    assert.strictEqual(isSafeTarEntryPath('/etc/passwd'), false);
    assert.strictEqual(isSafeTarEntryPath('package/../../etc/passwd'), false);
  });

  test('readTarEntriesFromTarGz rejects invalid gzip payloads', () => {
    assert.throws(
      () => readTarEntriesFromTarGz(Buffer.from('not-a-gzip')),
      /Failed to decompress npm tarball/
    );
  });

  test('syncPrebuilt writes downloaded binaries into bin/prebuilt', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-sync-write-'));
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ version: '2.1.5', repository: { url: 'git+https://github.com/Colin4k1024/tsp.git' } }),
      'utf8'
    );

    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
    });

    const plan = await syncPrebuilt({
      root,
      repo: null,
      ref: 'main',
      fallbackRef: null,
      token: null,
      apiBase: 'https://api.github.com',
      platforms: ['darwin-arm64', 'win32-x64'],
      dryRun: false,
    }, { fetchImpl });

    assert.strictEqual(plan.downloads.length, 2);
    assert.ok(fs.existsSync(path.join(root, 'bin', 'prebuilt', 'darwin-arm64', 'oris-claude-bridge')));
    assert.ok(fs.existsSync(path.join(root, 'bin', 'prebuilt', 'win32-x64', 'oris-claude-bridge.exe')));

    fs.rmSync(root, { recursive: true, force: true });
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));

  console.log(`\nGitHub prebuilt sync: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
