'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const actual=JSON.parse(fs.readFileSync(path.join(root,'workspace/verification/native-phase-initial-frame.json'),'utf8').replace(/^\uFEFF/,''));
const session=require('../GFM/experiments/phase/backend/phase-session.js').createSession(actual.parameters);
const expected=session.snapshot(),rows=[];
assert.equal(actual.time,0);assert.equal(expected.grid.nx,actual.grid.nx);assert.equal(expected.grid.ny,actual.grid.ny);
function compareArrays(reference,value,name){
 if(Array.isArray(reference)&&reference.every(item=>typeof item==='number')){
  assert.ok(Array.isArray(value),name);assert.equal(value.length,reference.length,name);let maxAbsolute=0,maxScaled=0;
  reference.forEach((a,i)=>{const b=value[i];assert.ok(Number.isFinite(a)&&Number.isFinite(b),name+' finite');const d=Math.abs(a-b);maxAbsolute=Math.max(maxAbsolute,d);maxScaled=Math.max(maxScaled,d/Math.max(1e-12,Math.abs(a),Math.abs(b)));});
  assert.ok(maxScaled<1e-10,name+' native parity');rows.push({field:name,samples:reference.length,maxAbsoluteDifference:maxAbsolute,maxScaledDifference:maxScaled});
 }else if(reference&&typeof reference==='object')for(const [key,item]of Object.entries(reference))compareArrays(item,value?.[key],name+'.'+key);
}
for(const name of ['fields','conserved','staggeredMagneticField','materials'])compareArrays(expected[name],actual[name],name);
assert.ok(actual.gfm.inverseResidual<1e-10);
const report={schema:'GFM-native-phase-parity/1',passed:true,nativeSource:'Actual embedded WebView2 phase worker',referenceSource:'Unchanged phase backend with exported parameters at time zero',relativeTolerance:1e-10,fields:rows.length,samples:rows.reduce((n,v)=>n+v.samples,0),comparisons:rows};
fs.writeFileSync(path.join(root,'workspace/verification/native-phase-parity.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,fields:report.fields,samples:report.samples,maxScaledDifference:Math.max(...rows.map(v=>v.maxScaledDifference))}));
