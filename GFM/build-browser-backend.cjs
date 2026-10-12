'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = __dirname;
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const names = ['backend/cylinder-em.cjs', 'backend/material-physics.cjs', 'backend/phase-history.cjs', 'backend/research-presets.cjs', 'backend/gr-reference.cjs'];

function build() {
  const sourceModulesSHA256 = {}, factories = [];
  for (const name of names) {
    const source = fs.readFileSync(path.join(ROOT, name), 'utf8');
    sourceModulesSHA256[name] = sha(Buffer.from(source));
    factories.push(JSON.stringify(name) + ':function(module,exports,require){\n' + source + '\n}');
  }
  const auditBytes = fs.readFileSync(path.join(ROOT, 'data/audit-findings.json'));
  const phaseBytes = fs.readFileSync(path.join(ROOT, 'data/phase-reference.json'));
  sourceModulesSHA256['data/audit-findings.json'] = sha(auditBytes);
  sourceModulesSHA256['data/phase-reference.json'] = sha(phaseBytes);
  const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'release-info.json')));
  const metadata = { schema: 'GFM-browser-backend-build/1', transport: 'browser-worker', release,
    engineSHA256: sourceModulesSHA256['backend/cylinder-em.cjs'], sourceModulesSHA256,
    phaseReferenceSHA256: sourceModulesSHA256['data/phase-reference.json'], equationSourceTransformation: 'none' };
  const bundle = { ...metadata, phaseReference: JSON.parse(phaseBytes) };
  const prefix = "'use strict';\nconst GFM_BUNDLE=" + JSON.stringify(bundle) + ';\nconst factories={' + factories.join(',\n') + ',\n' + JSON.stringify('data/audit-findings.json') + ':function(module){module.exports=' + JSON.stringify(JSON.parse(auditBytes)) + ';}};\n' +
    `const cache=Object.create(null);\nfunction bundledRequire(name,from=''){\n if(name.startsWith('.')){const parts=(from.slice(0,from.lastIndexOf('/')+1)+name).split('/'),out=[];for(const p of parts){if(p==='..')out.pop();else if(p&&p!=='.')out.push(p);}name=out.join('/');}\n if(cache[name])return cache[name].exports;if(!factories[name])throw Error('Unknown bundled module: '+name);const module={exports:{}};cache[name]=module;factories[name](module,module.exports,n=>bundledRequire(n,name));return module.exports;\n}\n`;
  const workerSource = prefix + fs.readFileSync(path.join(ROOT, 'browser/worker-controller.cjs'), 'utf8');
  const browserSource = "/* Generated from audited sources; rebuild with build-browser-backend.cjs. */\n'use strict';\nconst GFM_BROWSER_METADATA=" + JSON.stringify(metadata) + ';\nconst GFM_WORKER_SOURCE=' + JSON.stringify(workerSource) + ';\n' + fs.readFileSync(path.join(ROOT, 'browser/transport.cjs'), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'public/browser-backend.js'), browserSource);
  const receipt = { ...metadata, browserBundleBytes: Buffer.byteLength(browserSource), workerSourceBytes: Buffer.byteLength(workerSource), browserBundleSHA256: sha(Buffer.from(browserSource)), workerSourceSHA256: sha(Buffer.from(workerSource)) };
  fs.writeFileSync(path.join(ROOT, 'validation/browser-backend-build.json'), JSON.stringify(receipt, null, 2) + '\n');
  return { workerSource, browserSource, metadata, receipt };
}
if (require.main === module) console.log(JSON.stringify(build().receipt, null, 2));
module.exports = { build };
