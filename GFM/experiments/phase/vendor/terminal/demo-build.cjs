'use strict';
const fs=require('node:fs'),path=require('node:path');
const GM=require('./src/gfm-mechanics.js'),E=require('./src/engine.js');
const fmt=x=>x===0?'0':Number(x.toPrecision(9)).toString();
const z=v=>fmt(v.re)+(v.im<0?' − ':' + ')+fmt(Math.abs(v.im))+'i';
function calculate(){
  const input=GM.profile('gf9','pendulum',{g:9.81,length:1,maxAngle:.2});
  const forward=GM.traceTransform(input),inverse=GM.traceTransform(forward.dataset,true);
  if(!forward.passed||!inverse.passed)throw Error('Pendulum example failed recovery.');
  return {schema:'RUSSL-GFM-pendulum-example/1',equation:'theta_ddot=-(g/length)*sin(theta)',parameters:input.codec.parameters,fieldDefinition:E.fields.gf9,units:input.codec.units,input,forward,inverse,maximumAbsoluteRecoveryError:Math.max(...input.values.map((v,i)=>Math.hypot(v.re-inverse.dataset.values[i].re,v.im-inverse.dataset.values[i].im))),scope:'Calculated saved example. The equation gives acceleration versus angle; it is not a pendulum time trajectory. GF9 indexes the raw ordinary samples; the trace transform does not normalize their data.'};
}
function markup(d=calculate()){
  const rows=d.input.values.map((v,i)=>`<tr><td>${i}</td><td>${fmt(d.input.codec.nodes[i])}</td><td>${fmt(v.re)}</td><td>${z(d.forward.dataset.values[i])}</td><td>${fmt(d.inverse.dataset.values[i].re)}</td></tr>`).join('');
  return `<section class="saved-example"><p class="eyebrow">CALCULATED EXAMPLE · READ-ONLY SNAPSHOT</p><h2>Pendulum equation applied to GF9 data</h2><p><strong>θ̈ = −(g/l) sin θ</strong> · g = 9.81 m/s² · l = 1 m · −0.2 ≤ θ ≤ 0.2 rad.</p><p>Raw acceleration samples → positive trace-character transform → inverse recovery.</p><p>F[k,x] = exp(2πi Tr(kx)/3)/3. The field is GF3[α]/(α²+1); labels encode a + bα as a + 3b.</p><div class="saved-table-wrap"><table><thead><tr><th>Label x / k</th><th>Input angle θₓ (rad)</th><th>Raw acceleration (rad/s²)</th><th>Trace coefficient yₖ (rad/s²)</th><th>Recovered acceleration (rad/s²)</th></tr></thead><tbody>${rows}</tbody></table></div><p>Input L2 norm: <strong>${fmt(d.forward.inputNorm)}</strong> · transformed L2 norm: <strong>${fmt(d.forward.outputNorm)}</strong> · largest recovery error: <strong>${d.maximumAbsoluteRecoveryError.toExponential(3)}</strong> rad/s².</p><p class="small-note">Each row pairs the original label x with the coefficient label k having the same integer code. The coefficient does not belong to that row's physical angle. All values above were computed by the supplied GFM engine when this snapshot was generated; these are saved results, not live preview calculations.</p></section>`;
}
function build(){
  const d=calculate(),html=markup(d);
  const css='body{margin:0;background:#101419;color:#e8edf0;font:15px/1.6 Segoe UI,Arial,sans-serif}main{max-width:1150px;margin:auto;padding:38px 28px}h1{font-size:30px;font-weight:500}h2{font-size:24px}.eyebrow{font-size:11px;color:#95a2af;letter-spacing:1px}.saved-table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font:12px/1.5 Consolas,monospace}td,th{padding:12px 10px;border-bottom:1px solid #303a45;text-align:left}th{color:#88cfdf}.small-note{font-size:12px;color:#95a2af}a{color:#88cfdf}strong{color:#b9ed95}';
  fs.writeFileSync(path.join(__dirname,'docs/Pendulum_Example.json'),JSON.stringify(d,null,2)+'\n');
  const header='label,input_angle_rad,raw_acceleration_rad_s2,trace_coefficient_real,trace_coefficient_imag,recovered_acceleration_rad_s2';
  const csv=d.input.values.map((v,i)=>[i,d.input.codec.nodes[i],v.re,d.forward.dataset.values[i].re,d.forward.dataset.values[i].im,d.inverse.dataset.values[i].re].join(','));
  fs.writeFileSync(path.join(__dirname,'docs/Pendulum_Example.csv'),header+'\n'+csv.join('\n')+'\n');
  fs.writeFileSync(path.join(__dirname,'docs/Pendulum_Example.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GFM pendulum — calculated data</title><style>'+css+'</style></head><body><main><h1>GFM equation-to-model results</h1><p>This document displays completed calculations and uses no scripts. It can be read even when live controls are unavailable.</p>'+html+'<p><a href="Pendulum_Example.csv">Numeric CSV</a> · <a href="Pendulum_Example.json">Complete calculation record</a></p></main></body></html>\n');
  return d;
}
if(require.main===module){const d=build();console.log(JSON.stringify({passed:d.forward.passed&&d.inverse.passed,rawNorm:d.forward.inputNorm,transformedNorm:d.forward.outputNorm,maxRecoveryError:d.maximumAbsoluteRecoveryError,samples:d.input.values.map((v,i)=>({angle:d.input.codec.nodes[i],acceleration:v.re,coefficient:d.forward.dataset.values[i]}))},null,2));}
module.exports={calculate,markup,build};
