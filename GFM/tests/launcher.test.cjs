'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const http=require('node:http');
const {verifyInstallation}=require('../verify-install.cjs');
const {launch}=require('../launch.cjs');

test('Windows packaging handles spaces and rejects changed, escaping, and overlong members',()=>{
 const folder=fs.mkdtempSync(path.join(__dirname,'../validation/launcher fixture '));
 const file=path.join(folder,'probe.txt'),manifest=path.join(folder,'release-manifest.json');
 const bytes=Buffer.from('known complete bytes');
 const item={path:'probe.txt',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 const write=entry=>fs.writeFileSync(manifest,JSON.stringify({version:'test',files:[entry]}));
 try{
  fs.writeFileSync(file,bytes);write(item);assert.equal(verifyInstallation(folder).files,1);
  fs.writeFileSync(file,'changed');assert.throws(()=>verifyInstallation(folder),/changed or is incomplete/);
  write({...item,path:'../server.cjs'});assert.throws(()=>verifyInstallation(folder),/Invalid packaged/);
  write({...item,path:'a'.repeat(220)+'.txt'});assert.throws(()=>verifyInstallation(folder),/too long/);
 }finally{
  if(fs.existsSync(file))fs.unlinkSync(file);if(fs.existsSync(manifest))fs.unlinkSync(manifest);fs.rmdirSync(folder);
 }
});

test('launcher recovers from an occupied port and starts the new computed backend',async()=>{
 const blocker=http.createServer((req,res)=>{res.end('occupied');});
 await new Promise(resolve=>blocker.listen(0,'127.0.0.1',resolve));
 let launched;
 try{
  const start=blocker.address().port;
  assert.ok(start<65525,'An available low enough dynamic port is needed for this check.');
  launched=await launch({port:start,openBrowser:false});assert.ok(launched.port>start);
  const health=await(await fetch(launched.url+'api/health')).json();
  assert.equal(health.product,'GFM Cylindrical Pulse Laboratory');assert.equal(health.version,require('../release-info.json').version);
  const pause=await(await fetch(launched.url+'api/control',{method:'POST',body:JSON.stringify({action:'pause'})})).json();assert.equal(pause.running,false);
  const step=await(await fetch(launched.url+'api/control',{method:'POST',body:JSON.stringify({action:'step'})})).json();
  assert.ok(step.timeSeconds>pause.timeSeconds);assert.ok(step.fields.EphiVPerM.some(v=>v!==0));
 }finally{
  if(launched)await new Promise(resolve=>launched.server.close(resolve));
  await new Promise(resolve=>blocker.close(resolve));
 }
});
