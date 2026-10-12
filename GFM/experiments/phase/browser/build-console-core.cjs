'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),modules=new Map(),assets={};
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function collect(file){
 file=file.replaceAll('\\','/');if(modules.has(file))return;
 const source=fs.readFileSync(path.join(root,file),'utf8');modules.set(file,source);
 for(const match of source.matchAll(/require\(['"]([^'"]+)['"]\)/g)){
  if(!match[1].startsWith('.'))continue;
  let dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
  if(!path.posix.extname(dependency))dependency+='.js';collect(dependency);
 }
}
collect('backend/simulation.cjs');collect('backend/observations.cjs');
for(const file of ['data/observations/observations.json','data/observations/protocol.json','data/observations/source-manifest.json','backend/observations.cjs']){
 const bytes=fs.readFileSync(path.join(root,file));assets['/phase/'+file]={text:bytes.toString('utf8'),length:bytes.length,sha256:sha(bytes)};
}
const manifest=JSON.parse(assets['/phase/data/observations/source-manifest.json'].text);
for(const item of manifest.files){const file='data/observations/'+item.path,bytes=fs.readFileSync(path.join(root,file));assets['/phase/'+file]={text:bytes.toString('utf8'),length:bytes.length,sha256:sha(bytes)};}
const hashes=Object.fromEntries([...modules].map(([file])=>[file,sha(fs.readFileSync(path.join(root,file)))]));
const factories=[...modules].map(([file,source])=>JSON.stringify('/phase/'+file)+':function(require,module,exports,__dirname,__filename){\n'+source+'\n}').join(',\n');
const output=`/* Generated exact-source CommonJS bundle; rebuild with browser/build-console-core.cjs. */
(function(root){'use strict';
const files=${JSON.stringify(assets)},factories={${factories}},cache={};
const normalize=value=>{const parts=[];for(const part of value.split('/')){if(!part||part==='.')continue;if(part==='..')parts.pop();else parts.push(part);}return '/'+parts.join('/');};
const digestText=new Map(Object.values(files).map(value=>[value.text,value.sha256]));
const shims={
 'node:path':{join:(...parts)=>normalize(parts.join('/')),resolve:(...parts)=>normalize(parts.join('/'))},
 'node:fs':{readFileSync(file,encoding){const value=files[normalize(file)];if(!value)throw new Error('Unbundled observation source: '+file);return encoding?value.text:{length:value.length,toString:()=>value.text};}},
 'node:crypto':{randomUUID:()=>root.crypto.randomUUID(),createHash(algorithm){if(algorithm!=='sha256')throw new Error('Unsupported source digest');let content;return {update(value){content=typeof value==='string'?value:value.toString();return this;},digest(format){if(format!=='hex'||!digestText.has(content))throw new Error('Unregistered source bytes');return digestText.get(content);}};}}
};
function load(file){file=normalize(file);if(cache[file])return cache[file].exports;if(!factories[file])throw new Error('Unbundled module: '+file);const module={exports:{}};cache[file]=module;const dir=file.slice(0,file.lastIndexOf('/'));function require(name){if(shims[name])return shims[name];let target=normalize(dir+'/'+name);if(!factories[target])target+='.js';return load(target);}require.main=null;factories[file](require,module,module.exports,dir,file);return module.exports;}
root.GFMConsoleCore={simulation:load('/phase/backend/simulation.cjs'),observations:load('/phase/backend/observations.cjs'),sourceHashes:${JSON.stringify(hashes)}};
})(globalThis);
`;
fs.writeFileSync(path.join(root,'public/console-core.js'),output);
fs.writeFileSync(path.join(root,'validation/console-core-build.json'),JSON.stringify({schema:'GFM-phase-offline-source-bundle/1',sourceHashes:hashes,observationDataHashes:Object.fromEntries(Object.entries(assets).map(([name,value])=>[name,value.sha256])),bundleSHA256:sha(Buffer.from(output)),numericSourceEdits:false},null,2)+'\n');
console.log(JSON.stringify({modules:modules.size,bytes:Buffer.byteLength(output),numericSourceEdits:false}));
