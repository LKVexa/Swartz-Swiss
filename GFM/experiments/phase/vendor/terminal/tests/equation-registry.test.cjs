'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Audit integrity tests, not certification of the unavailable 500-equation
// suite. The frozen candidate hash identifies the user-supplied report.
// No generator or application module is imported, and no files are written.
const root = path.resolve(__dirname, '..');
const sourceBytes = fs.readFileSync(path.join(root, 'reference', 'Equation audit candidate.txt'));
const sourceText = sourceBytes.toString('utf8');
const sourceLines = sourceText.split(/\r\n|\n|\r/);
const registry = JSON.parse(fs.readFileSync(path.join(root, 'equation-audit.json'), 'utf8'));
const report = fs.readFileSync(path.join(root, 'docs', 'Equation_Audit.txt'), 'utf8');
const candidateSha = '068f68965b6157c88e9e881a48a6bfacfc040455cb957af17f613785ad0237f8';

test('registry provenance matches the preserved report bytes and SHA-256', () => {
  const actualSha = crypto.createHash('sha256').update(sourceBytes).digest('hex');
  assert.equal(actualSha, candidateSha);
  assert.equal(sourceBytes.length, 14113);
  assert.equal(registry.source.sha256, actualSha);
  assert.equal(registry.source.bytes, sourceBytes.length);
  assert.equal(registry.source.path, 'reference/Equation audit candidate.txt');
  assert.equal(registry.source.originalName, 'Please audit, parse, and refine these equations.txt');
  assert.ok(report.includes(actualSha));
  assert.ok(report.includes('14113 bytes; 12 displayed math blocks'));
  assert.match(registry.scope, /original 500-equation suite unavailable/i);
});

test('all 12 raw displayed formulas retain exact source text and line locations', () => {
  // This particular frozen report places each displayed formula on one line.
  // Locate those complete lines independently of the generator's block regex.
  const originalDisplays = [];
  sourceLines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
      assert.equal(trimmed.split('$$').length - 1, 2);
      originalDisplays.push({
        line: index + 1,
        latex: trimmed.substring(2, trimmed.length - 2).trim(),
      });
    }
  });
  assert.equal(sourceText.split('$$').length - 1, 24);
  assert.equal(originalDisplays.length, 12);
  assert.equal(registry.parsed.displayMath.length, 12);
  registry.parsed.displayMath.forEach((block, index) => {
    const original = originalDisplays[index];
    assert.equal(block.id, `display-${index + 1}`);
    assert.equal(block.lineStart, original.line);
    assert.equal(block.lineEnd, original.line);
    assert.equal(block.latex, original.latex);
    assert.equal(sourceLines[block.lineStart - 1].trim(), `$$${block.latex}$$`);
  });
});

test('semantic display attribution separates delta, product rule, commutator and Cayley', () => {
  const byEntry = Object.fromEntries(registry.entries.map(entry => [entry.id, entry]));
  const byDisplay = Object.fromEntries(registry.parsed.displayMath.map(block => [block.id, block]));
  const expected = {
    'eq-78': ['display-1'],
    'eq-181': ['display-2', 'display-3'],
    'eq-437': ['display-4', 'display-5'],
    'eq-438': ['display-6'],
    'eq-67': ['display-7'],
    'eq-88': ['display-8'],
    'eq-318': ['display-9'],
    'eq-319': ['display-10'],
    'eq-370': ['display-11'],
    'eq-417': ['display-12'],
  };
  for (const [id, displayIds] of Object.entries(expected)) {
    assert.deepEqual(byEntry[id].sourceDisplayIds, displayIds, id);
  }
  assert.ok(byDisplay['display-9'].latex.includes('\\delta_p(x) ='));
  assert.ok(byDisplay['display-10'].latex.includes('\\delta_p(xy)'));
  assert.ok(byDisplay['display-11'].latex.includes('[\\hat{X}, \\hat{P}]'));
  assert.ok(byDisplay['display-12'].latex.includes('\\psi(t + \\delta t)'));
  assert.ok(!byDisplay['display-12'].latex.includes('\\hat{J}_z'));
  const attributed = registry.entries.flatMap(entry => entry.sourceDisplayIds);
  assert.equal(attributed.length, 12);
  assert.equal(new Set(attributed).size, 12);
  assert.deepEqual(new Set(attributed), new Set(Object.keys(byDisplay)));
});

test('registry IDs and aliases form an unambiguous lookup namespace', () => {
  const tokens = new Map();
  const register = (token, owner) => {
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 0 && token === token.trim());
    assert.ok(!tokens.has(token), `${token} is shared by ${tokens.get(token)} and ${owner}`);
    tokens.set(token, owner);
  };
  for (const entry of registry.entries) {
    register(entry.id, entry.id);
    assert.ok(Array.isArray(entry.aliases));
    entry.aliases.forEach(alias => register(alias, entry.id));
  }
  assert.equal(tokens.get('319'), 'eq-319');
  assert.equal(tokens.get('417'), 'eq-417');
  assert.equal(tokens.get('cayley'), 'eq-417');
  assert.equal(tokens.get('370'), 'eq-370');
});

test('only accepted-domain entries advertise executable commands', () => {
  const statuses = new Set(['verified', 'refined', 'rejected', 'unresolved']);
  const counts = { verified: 0, refined: 0, rejected: 0, unresolved: 0 };
  let executable = 0;
  for (const entry of registry.entries) {
    assert.ok(statuses.has(entry.status), `unknown status on ${entry.id}`);
    counts[entry.status]++;
    assert.ok(entry.domain.length > 0, `missing domain on ${entry.id}`);
    if (entry.command !== null) {
      executable++;
      assert.equal(typeof entry.command, 'string');
      assert.ok(entry.command.trim().length > 0);
      assert.ok(entry.status === 'verified' || entry.status === 'refined', entry.id);
      assert.equal(entry.execution, 'implemented in declared domain');
    } else {
      assert.equal(entry.execution, 'reference only');
    }
    if (entry.status === 'rejected' || entry.status === 'unresolved') {
      assert.equal(entry.command, null, `${entry.id} must remain non-executable`);
    }
  }
  assert.ok(executable > 0);
  assert.equal(registry.entries.length, 20);
  assert.deepEqual(counts, { verified: 5, refined: 10, rejected: 2, unresolved: 3 });
  assert.ok(report.includes(JSON.stringify(counts)));
});
