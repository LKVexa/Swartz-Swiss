'use strict';
// Repackage the entire original CJS source, without changing an equation,
// integration policy, point, diagnostic, or outcome classification.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const sourceRelative = 'backend/relativity.cjs';
const source = fs.readFileSync(path.join(ROOT, sourceRelative));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const coreRelative = 'public/relativity-core.js';
const workerRelative = 'public/relativity-worker.js';
const provenanceRelative = 'public/relativity-provenance.js';
const wrapperBefore = "/* Generated exact-source Kerr solver; rebuild with browser/build-relativity.cjs. */\n(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GFMRelativity=factory();})(typeof globalThis==='object'?globalThis:this,function(){\nconst localModule={exports:{}};\n(function(module,exports){\n";
const wrapperAfter = "\n})(localModule,localModule.exports);\nreturn localModule.exports;\n});\n";
const core = Buffer.concat([Buffer.from(wrapperBefore), source, Buffer.from(wrapperAfter)]);
fs.writeFileSync(path.join(ROOT, coreRelative), core);
const sourceHashes = Object.fromEntries([sourceRelative, coreRelative, workerRelative].map(file => [file, sha(fs.readFileSync(path.join(ROOT, file)))]));
const metadata = {schema: 'GFM-offline-Kerr-source-identity/1', sourceHashes, sourceTransformation: 'none; literal CommonJS source wrapped in a module factory',
  protocol: 'request {id,inputs}; response {id,ok,result,milliseconds,sourceHashes,solverSourceSha256,workerSourceSha256}',
  scope: 'Original neutral Kerr exterior solver. No pulse, plasma, cover, formation, or traversability coupling.'};
const provenanceSource = "/* Generated loaded Kerr source identity; release integrity covers this file. */\n(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GFMRelativityProvenance=factory();})(typeof globalThis==='object'?globalThis:this,function(){return " + JSON.stringify(metadata) + ";});\n";
fs.writeFileSync(path.join(ROOT, provenanceRelative), provenanceSource);
const receipt = {...metadata, generatedFiles: {[coreRelative]: {bytes: core.length, sha256: sourceHashes[coreRelative]}, [provenanceRelative]: {bytes: Buffer.byteLength(provenanceSource), sha256: sha(Buffer.from(provenanceSource))}},
  literalSourceBytes: source.length, deterministic: true, networkRequired: false};
fs.writeFileSync(path.join(__dirname, 'relativity-build.json'), JSON.stringify(receipt, null, 2) + '\n');
if (require.main === module) process.stdout.write(JSON.stringify(receipt) + '\n');
module.exports = receipt;
