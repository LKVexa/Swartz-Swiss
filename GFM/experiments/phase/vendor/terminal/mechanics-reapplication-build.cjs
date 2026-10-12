'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const E=require('./src/engine.js'),GM=require('./src/gfm-mechanics.js');
const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
const digest=v=>crypto.createHash('sha256').update(stable(v)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,p),'utf8'));
const timestamp='2026-10-11T00:00:00.000Z'; // Fixed example metadata, not a runtime measurement.
function build(){
  const config=read('source-register.json'),current=read('horizon-equations.json'),previous=read('equation-audit.json');
  for(const source of config.sources){const bytes=fs.readFileSync(path.join(__dirname,source.path));if(bytes.length!==source.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==source.sha256)throw Error('Preserved source changed: '+source.path);}
  const result=GM.reapply(current,previous);if(!result.passed)throw Error('Raw mechanics reapplication failed.');
  result.preparedAt=timestamp;result.sources=config.sources;result.imageRegistry=read('image-equations.json');
  result.simulationSpecification=read('horizon-reapplication.json').simulationSpecification;
  result.currentContract=fs.readFileSync(path.join(__dirname,'docs/GFM_Terminal_Identity.txt'),'utf8');
  result.referenceScope='The preserved specification and older reports retain their historical conventions. The current mechanics dataset, raw profiles and exact polynomial examples below use the v0.5 contract.';
  result.exactPolynomialExamples={};
  for(const field of Object.keys(E.fields)){
    const f=E.field(field),input=GM.dataset(field,Array.from({length:f.q-1},(_,i)=>i),{kind:'exact-polynomial-example',units:'field elements'},'field-values'),forward=GM.polynomialTransform(input),inverse=GM.polynomialTransform(forward.dataset,true);
    if(!forward.passed||!inverse.passed)throw Error('Exact transform failed: '+field);
    result.exactPolynomialExamples[field]={input,forward,inverse};
  }
  const zeroSamples=GM.profile('gf9','aggiePassage'),zeroTransform=GM.traceTransform(zeroSamples);
  if(!zeroTransform.passed||zeroTransform.dataset.values.some(v=>v.re!==0||v.im!==0))throw Error('Zero passage data changed.');
  result.zeroPassageExample={samples:zeroSamples,transform:zeroTransform};
  const examples=[
    ['Raw exterior gtt trace',result.dataset],
    ['Raw restoring acceleration trace',result.report.images.pendulum.dataset],
    ['Exact GF9 polynomial coefficients',result.exactPolynomialExamples.gf9.forward.dataset],
    ['Zero aggie passage data',zeroTransform.dataset],
    ['Raw Mellin kernel trace',result.report.images.zetaGamma.dataset]
  ];
  const records=examples.map(([label,dataset],i)=>{const data={schema:'RUSSL-research-record/1',kind:'gfm-dataset',label,capturedAt:timestamp,payload:{dataset:GM.validate(dataset),scope:'Declared mechanics data. History is inert; no normalized quantum-state preparation.'}};const sha256=digest(data);return {id:'rec-mechanics-'+(i+1)+'-'+sha256.slice(0,8),sha256,data};});
  const f=E.fields.gf9,snapshot={model:{schema:'RUSSL-finite-field-model/1',field:f,labelEncoding:'integer = sum(c_i * p^i), polynomial coefficients low first',amplitudes:'complex floating point',fourierSign:'+2pi i',normalization:'1/sqrt(q)',character:'exp(2pi i Tr(x)/p)',tolerance:E.tolerance,backend:'local browser JavaScript',physicalScope:'finite-dimensional complex-amplitude simulation'},state:E.basisState(9,1),description:'Compatibility-only reference basis; primary mechanics is separate',operations:0,normSquared:1};
  const data={schema:'RUSSL-virtual-session/1',version:'0.5.0',kind:'session',exportedAt:timestamp,mechanics:result.dataset,snapshot,referenceMathScope:'snapshot is a compatibility-only reference state; mechanics is the active GFM dataset.',horizonSimulation:{parameters:result.report.scenario.parameters,probe:'exterior'},records,commandProvenance:['gfm.reapply'],returns:[{id:'ret-mechanics-reapplication',command:'gfm.reapply',ok:true,summary:'Raw mechanics signal transformed; equation domains retained.',profile:'GFM / registered mechanics adapters',elapsedMs:0,details:result}]};
  const packet={sha256:digest(data),data};if(Buffer.byteLength(JSON.stringify(packet))>4*1024*1024)throw Error('Session exceeds envelope limit.');
  return {result,packet};
}
if(require.main===module){const {result,packet}=build();fs.writeFileSync(path.join(__dirname,'mechanics-reapplication.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'examples/GFM-Mechanics-session.json'),JSON.stringify(packet,null,2)+'\n');console.log('Built raw GFM report, five exact-field examples, zero-passage data and reloadable v0.5 session.');}
module.exports={build,stable,digest};

