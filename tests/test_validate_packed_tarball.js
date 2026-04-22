#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const {
  parseArgs,
  resolveTarballPath,
  validateTarball,
} = require('../scripts/validate-packed-tarball');

function createTarGz(entries) {
  const records = [];

  for (const entry of entries) {
    const contents = Buffer.isBuffer(entry.contents) ? entry.contents : Buffer.from(entry.contents || '');
    const header = Buffer.alloc(512, 0);
    Buffer.from(entry.name).copy(header, 0, 0, Math.min(Buffer.byteLength(entry.name), 100));
    Buffer.from('0000777\0').copy(header, 100);
    Buffer.from('0000000\0').copy(header, 108);
    Buffer.from('0000000\0').copy(header, 116);
    Buffer.from(contents.length.toString(8).padStart(11, '0') + '\0').copy(header, 124);
    Buffer.from(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0').copy(header, 136);
    header.fill(0x20, 148, 156);
    header[156] = '0'.charCodeAt(0);
    Buffer.from('ustar\0').copy(header, 257);
    Buffer.from('00').copy(header, 263);

    let checksum = 0;
    for (const byte of header) {
      checksum += byte;
    }
    Buffer.from(checksum.toString(8).padStart(6, '0') + '\0 ').copy(header, 148);

    records.push(header, contents);
    const remainder = contents.length % 512;
    if (remainder !== 0) {
      records.push(Buffer.alloc(512 - remainder, 0));
    }
  }

  records.push(Buffer.alloc(1024, 0));
  return zlib.gzipSync(Buffer.concat(records));
}

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`✓ ${name}\n`);
  } catch (error) {
    process.stderr.write(`✗ ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

test('parseArgs accepts tarball and platforms', () => {
  const options = parseArgs([
    'node',
    'script',
    '--root',
    '/tmp/work',
    '--tarball',
    'pkg.tgz',
    '--platform',
    'darwin-arm64',
    'win32-x64',
  ]);

  assert.strictEqual(options.root, '/tmp/work');
  assert.strictEqual(options.tarball, path.resolve('/tmp/work', 'pkg.tgz'));
  assert.deepStrictEqual(options.platforms, ['darwin-arm64', 'win32-x64']);
});

test('resolveTarballPath reads npm pack json output', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tarball-pack-json-'));
  const tarballPath = path.join(root, 'pkg.tgz');
  const packJsonPath = path.join(root, '.npm-pack.json');
  fs.writeFileSync(tarballPath, 'tarball');
  fs.writeFileSync(packJsonPath, JSON.stringify([{ filename: 'pkg.tgz' }]), 'utf8');

  assert.strictEqual(resolveTarballPath({ root, tarball: null, packJson: packJsonPath }), tarballPath);
  fs.rmSync(root, { recursive: true, force: true });
});

test('resolveTarballPath picks newest tgz in root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tarball-root-'));
  const older = path.join(root, 'older.tgz');
  const newer = path.join(root, 'newer.tgz');
  fs.writeFileSync(older, 'old');
  fs.writeFileSync(newer, 'new');
  const olderTime = new Date(Date.now() - 10_000);
  fs.utimesSync(older, olderTime, olderTime);

  assert.strictEqual(resolveTarballPath({ root, tarball: null }), newer);
  fs.rmSync(root, { recursive: true, force: true });
});

test('validateTarball passes when all requested prebuilt entries exist', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tarball-ok-'));
  const tarballPath = path.join(root, 'pkg.tgz');
  const tarball = createTarGz([
    { name: 'package/bin/prebuilt/darwin-arm64/oris-claude-bridge', contents: Buffer.from([1]) },
    { name: 'package/bin/prebuilt/win32-x64/oris-claude-bridge.exe', contents: Buffer.from([2]) },
  ]);
  fs.writeFileSync(tarballPath, tarball);

  const result = validateTarball(tarballPath, ['darwin-arm64', 'win32-x64']);
  assert.deepStrictEqual(result.missing, []);

  fs.rmSync(root, { recursive: true, force: true });
});

test('validateTarball reports missing prebuilt entries', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tarball-missing-'));
  const tarballPath = path.join(root, 'pkg.tgz');
  const tarball = createTarGz([
    { name: 'package/bin/prebuilt/darwin-arm64/oris-claude-bridge', contents: Buffer.from([1]) },
  ]);
  fs.writeFileSync(tarballPath, tarball);

  const result = validateTarball(tarballPath, ['darwin-arm64', 'linux-x64']);
  assert.deepStrictEqual(result.missing, ['package/bin/prebuilt/linux-x64/oris-claude-bridge']);

  fs.rmSync(root, { recursive: true, force: true });
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}
