'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createSession}=require('../backend/phase-session.js');
const filename=process.argv[2];if(!filename)throw new Error('Supply a downloaded GFM-phase-fields.json.');
const exported=JSON.parse(fs.readFileSync(filename,'utf8')),frame=exported.frame;
assert.equal(exported.schema,'GFM-phase-export/1');assert.equal(frame.schema,'GFM-Phase-MHD-frame/1');
assert.ok(frame.sequence>=0&&frame.sequence<=10000);
const session=createSession(frame.parameters);
for(let i=0;i<frame.sequence;i++)session.control('step');
const replay=session.snapshot();assert.equal(replay.time,frame.time);
let compared=0,maximumAbsoluteDifference=0;
function compare(a,b,key){
  if(typeof a==='number'){assert.ok(Number.isFinite(a)&&Number.isFinite(b),key);maximumAbsoluteDifference=Math.max(maximumAbsoluteDifference,Math.abs(a-b));compared++;assert.ok(Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(a)),key);return;}
  if(Array.isArray(a)){assert.equal(a.length,b.length,key);a.forEach((v,i)=>compare(v,b[i],key+'['+i+']'));return;}
  if(a&&typeof a==='object'){for(const k of Object.keys(a))compare(a[k],b[k],key+'.'+k);return;}
  assert.equal(a,b,key);
}
for(const key of ['fields','materials','diagnostics','grid','units','gfm'])compare(frame[key],replay[key],key);
const report={schema:'GFM-live-phase-replay/1',passed:true,input:path.resolve(filename),execution:exported.execution,sequence:frame.sequence,time:frame.time,comparedNumericValues:compared,maximumAbsoluteDifference,scope:'A real browser-downloaded frame was replayed by the backend session from its parameters and fixed 0.05 local-time output steps. Identity strings and running state are not mathematical fields. This checks shared-engine execution, not observational validity.'};
console.log(JSON.stringify(report,null,2));
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
