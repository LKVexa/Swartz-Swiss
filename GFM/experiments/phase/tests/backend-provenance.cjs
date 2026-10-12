'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const base = path.resolve(__dirname,'..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
test('all backend engines and the preserved terminal retain the registered source bytes', () => {
  const provenance=JSON.parse(fs.readFileSync(path.join(base,'SOURCE_PROVENANCE.json'),'utf8').replace(/^\uFEFF/,''));
  assert.equal(provenance.sourceTerminal,'RUSSL GFM Research Terminal 0.5.1');
  assert.equal(provenance.modules.length,9); assert.ok(provenance.terminalFiles.length>100);
  for (const module of provenance.modules) {
    const backend=fs.readFileSync(path.join(base,module.copied));
    const original=fs.readFileSync(path.join(base,'vendor/terminal',module.original));
    assert.equal(hash(backend),module.sha256,module.copied);
    assert.equal(backend.length,module.bytes,module.copied);
    assert.deepEqual(backend,original,module.copied+' differs from preserved source');
  }
  for(const registered of provenance.terminalFiles){const bytes=fs.readFileSync(path.join(base,registered.path));assert.equal(hash(bytes),registered.sha256,registered.path);assert.equal(bytes.length,registered.bytes,registered.path);}
});
