'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const native=JSON.parse(fs.readFileSync(path.join(root,'workspace/verification/native-initial-frame.json'),'utf8').replace(/^\uFEFF/,''));
const {createModel}=require('../GFM/backend/cylinder-em.cjs');
const {presetParameters}=require('../GFM/backend/research-presets.cjs');
const model=createModel(presetParameters('covered-plasma'));
let elapsed=0;
while(2e-9-elapsed>1e-22){const step=Math.min(4e-11,2e-9-elapsed);model.step(step);elapsed+=step;}
const expected=JSON.parse(JSON.stringify(model.snapshot()));
const comparisons=[];
for(const [name,values] of Object.entries(expected.fields)){
 if(!Array.isArray(values))continue;
 assert.equal(native.fields[name].length,values.length,name);
 let maxAbsolute=0,maxScaled=0;
 for(let i=0;i<values.length;i++){
  const a=values[i],b=native.fields[name][i];
  if(a===null||typeof a==='boolean'){assert.equal(b,a,name+' '+i);continue;}
  assert.ok(Number.isFinite(a)&&Number.isFinite(b),name+' '+i);
  const difference=Math.abs(a-b);maxAbsolute=Math.max(maxAbsolute,difference);maxScaled=Math.max(maxScaled,difference/Math.max(1e-18,Math.abs(a),Math.abs(b)));
 }
 assert.ok(maxScaled<1e-10,name+' native/browser numerical difference exceeds tolerance');
 comparisons.push({field:name,samples:values.length,maxAbsoluteDifference:maxAbsolute,maxScaledDifference:maxScaled});
}
assert.ok(Math.abs(expected.timeSeconds-native.timeSeconds)<1e-20);
const report={schema:'GFM-JA21-native-math-parity/1',passed:true,nativeSource:'Actual embedded WebView2 browser worker',referenceSource:'Original audited Node solver, identical covered-plasma advance schedule',timeSeconds:native.timeSeconds,fields:comparisons.length,samples:comparisons.reduce((n,item)=>n+item.samples,0),relativeTolerance:1e-10,comparisons};
fs.writeFileSync(path.join(root,'workspace/verification/native-parity.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,fields:report.fields,samples:report.samples,maxScaledDifference:Math.max(...comparisons.map(item=>item.maxScaledDifference))}));
