'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const escape = source => source.replace(/<\/script/gi, '<\\/script');
const scriptSources = [
  ['STARTUP', 'src/startup.js'],
  ['CONFIG', 'source-register.json', 'RusslConfig'],
  ['ENGINE', 'src/engine.js'],
  ['FIELD', 'src/refined-field.js'],
  ['SCALAR', 'src/refined-scalar.js'],
  ['MATRIX', 'src/gfm-matrix.js'],
  ['EXACT', 'src/gfm-exact.js'],
  ['MODELS', 'src/gfm-models.js'],
  ['REGISTRY', 'equation-audit.json', 'RusslEquationRegistry'],
  ['IMAGES', 'image-equations.json', 'RusslImageRegistry'],
  ['REAPPLICATION', 'gfm-reapplication.json', 'RusslReapplication'],
  ['HORIZONGR', 'src/horizon-gr.js'],
  ['SCENARIO', 'src/horizon-scenario.js'],
  ['HORIZON', 'src/horizon-models.js'],
  ['HORIZONREGISTRY', 'horizon-equations.json', 'RusslHorizonRegistry'],
  ['HORIZONDATA', 'horizon-reapplication.json', 'RusslHorizonData'],
  ['MECHANICS', 'src/gfm-mechanics.js'],
  ['APP', 'src/app.js']
];

test('offline entrypoint contains exactly the eighteen current source modules and declared registers', () => {
  const styles = ['src/styles.css', 'src/audit-styles.css', 'src/gfm-styles.css', 'src/horizon-styles.css', 'src/mechanics-styles.css'].map(read).join('\n');
  let expected = read('src/template.html').replace('/*__STYLE__*/', () => styles)
    .replace('/*__DEMO__*/', () => require('../demo-build.cjs').markup());
  const expectedScripts = scriptSources.map(([marker, file, global]) => {
    const raw = read(file);
    if (global) assert.doesNotThrow(() => JSON.parse(raw), file + ' must be valid JSON');
    const source = escape(global ? 'globalThis.' + global + '=' + raw + ';' : raw);
    assert.equal(expected.split('/*__' + marker + '__*/').length, 2, 'Exactly one ' + marker + ' placeholder is required');
    expected = expected.replace('/*__' + marker + '__*/', () => source);
    return source;
  });
  const artifact = read('index.html');
  assert.ok(artifact === expected, 'Offline artifact must exactly embed the editable sources');
  assert.equal(/\/\*__[A-Z_]+__\*\//.test(artifact), false, 'No unresolved build markers');
  const scripts = [...artifact.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.equal(scripts.length, 18);
  expectedScripts.forEach((source, i) => assert.ok(scripts[i] === source,
    scriptSources[i][1] + ' must occur exactly at dependency position ' + (i + 1)));
  scripts.forEach((source, i) => assert.doesNotThrow(() => new vm.Script(source), scriptSources[i][1]));
  assert.equal(/<script[^>]+src\s*=/i.test(artifact), false, 'Offline entrypoint must not require external scripts');
});

test('all literal interactive targets, including the GFM and horizon panels, exist uniquely in the template', () => {
  const template = read('src/template.html');
  const declaredIds = [...template.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const ids = new Set(declaredIds);
  const app = read('src/app.js') + '\n' + read('src/startup.js');
  const targets = [...app.matchAll(/\$\(\s*(['"])([^'"]+)\1\s*\)/g)].map(match => match[2]);
  const directTargets = [...app.matchAll(/getElementById\(\s*(['"])([^'"]+)\1\s*\)/g)].map(match => match[2]);
  for (const target of [...targets, ...directTargets]) assert.ok(ids.has(target), 'Missing DOM target ' + target);
  for (const target of ['view-gfm', 'gfm-summary', 'gfm-image-list', 'gfm-applicability', 'gfm-final']) {
    assert.ok(ids.has(target), 'Missing GFM target ' + target);
  }
  for (const target of ['m-field', 'm-domain', 'm-values', 'm-units', 'm-prepare', 'm-forward',
    'm-inverse', 'm-verify', 'm-record', 'm-reapply', 'm-export', 'm-bars', 'm-energy',
    'm-description', 'm-representation', 'm-domain-note', 'm-table', 'm-reference-toggle', 'm-plot-title', 'm-scale-note',
    'legacy-state-panel', 'legacy-kernel-panel', 'm-presets', 'engine-status', 'gfm-live-controls']) {
    assert.ok(ids.has(target), 'Missing primary mechanics target ' + target);
  }
  assert.equal(ids.size, declaredIds.length, 'IDs must be unique');
  assert.match(template, /data-view="gfm"/, 'GFM workspace tab must be present');
  assert.ok(ids.has('view-horizon'), 'Horizon workspace panel must be present');
  assert.match(template, /data-view="horizon"/, 'Horizon workspace tab must be present');
});

function verifyBytes(source) {
  const bytes = fs.readFileSync(path.join(root, source.path));
  assert.equal(bytes.length, source.bytes, source.title || source.originalName || source.path);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.sha256,
    source.title || source.originalName || source.path);
}

test('preserved references match every declared original byte identity', () => {
  const register = JSON.parse(read('source-register.json'));
  assert.ok(register.sources.length > 0);
  for (const source of register.sources) verifyBytes(source);
});

test('all three supplied equation images retain their audited original bytes', () => {
  const images = JSON.parse(read('image-equations.json'));
  assert.equal(images.schema, 'RUSSL-image-equations/1');
  assert.equal(images.entries.length, 3);
  assert.equal(new Set(images.entries.map(entry => entry.source.path)).size, 3);
  for (const entry of images.entries) {
    assert.equal(entry.sourcePath, entry.source.path);
    verifyBytes(entry.source);
  }
});

test('the five new horizon references and user writeup retain their declared package bytes', () => {
  const register = JSON.parse(read('source-register.json'));
  const paths = [
    'reference/blackhole-specification/Black_Hole_Master_Equations.pdf',
    'reference/blackhole-specification/eventHorizon.jpg',
    'reference/blackhole-specification/ETM.jpg',
    'reference/blackhole-specification/aggie aperture.png',
    'reference/blackhole-specification/Screenshot 2026-10-11 053124.png',
    'reference/blackhole-specification/User_Simulation_Writeup.txt'
  ];
  for (const reference of paths) {
    const source = register.sources.find(item => item.path === reference);
    assert.ok(source, 'Missing registered horizon reference ' + reference);
    verifyBytes(source);
  }
  const registry = JSON.parse(read('horizon-equations.json'));
  assert.equal(registry.schema, 'RUSSL-horizon-equations/1');
  assert.equal(registry.sources.length, 5);
  assert.deepEqual(new Set(registry.sources.map(source => source.path)), new Set(paths.slice(0, 5)));
  for (const source of registry.sources) {
    verifyBytes(source);
    const declared = register.sources.find(item => item.path === source.path);
    assert.equal(source.bytes, declared.bytes);
    assert.equal(source.sha256, declared.sha256);
  }
});

test('workbench derivative consists of the original plus the identified bounded relay', () => {
  const original = read('reference/workbench-original.html');
  const body = original.lastIndexOf('</body>');
  assert.ok(body >= 0);
  const expected = original.slice(0, body)
    + '\n<!-- Virtual-terminal bridge added 2026-10-11; original source retained separately. -->\n<script>'
    + escape(read('src/workbench-bridge.js')) + '</script>\n' + original.slice(body);
  assert.equal(read('reference/workbench.html'), expected);
});
