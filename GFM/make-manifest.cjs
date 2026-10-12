'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const RELEASE=require('./release-info.json');
const root=__dirname,files=[];
function walk(folder){
 for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  const file=path.join(folder,entry.name),relative=path.relative(root,file).split(path.sep).join('/');
  if(entry.isSymbolicLink())throw new Error('Package must not contain links: '+relative);
  if(entry.isDirectory()){if(!['__pycache__','.git'].includes(entry.name))walk(file);continue;}
  // Desktop publication writes this per-machine receipt after installation.
  // Keep it outside the immutable package so publishing cannot invalidate launch.
  if(relative==='release-manifest.json'||relative==='validation/desktop-publish.json'||relative.endsWith('.zip'))continue;
  if(relative.split('/').some(part=>/[<>:"|?*]/.test(part)||/[. ]$/.test(part)||/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(part)))throw new Error('Unsafe Windows member name: '+relative);
  if(file.length>240)throw new Error('Packaged Windows path exceeds 240 characters: '+file);
  const bytes=fs.readFileSync(file);
  files.push({path:relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
}
walk(root);
const manifest={...RELEASE,
 engineSHA256:files.find(f=>f.path==='backend/cylinder-em.cjs').sha256,
 phaseReferenceSHA256:files.find(f=>f.path==='data/phase-reference.json').sha256,
 windows:{pathLimitCharacters:240,longestAbsolutePathCharacters:Math.max(...files.map(f=>path.join(root,f.path).length)),relativeRuntime:true,systemInstallation:false},files};
fs.writeFileSync(path.join(root,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({files:files.length,longestPathCharacters:manifest.windows.longestAbsolutePathCharacters,engineSHA256:manifest.engineSHA256}));
