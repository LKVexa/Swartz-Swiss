'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const View=require('../public/phase-view.js');
const Core=require('../public/phase-mhd.js');

function frame(parameters={},sequence=0,runId='actual-run') {
  return {...Core.createModel(parameters).snapshot(),sequence,runId,running:false};
}
function element(properties={}) {
  return Object.assign({listeners:{},dataset:{},checked:true,disabled:false,textContent:'',value:'',
    addEventListener(name,handler){(this.listeners[name]||=[]).push(handler);},
    removeEventListener(name,handler){this.listeners[name]=(this.listeners[name]||[]).filter(x=>x!==handler);},
    emit(name,event={}){for(const handler of this.listeners[name]||[])handler({preventDefault(){},...event});}},properties);
}
function surface() {
  const calls=[],context={calls,createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},putImageData(image){this.image=image;},
    setTransform(...args){assert.ok(args.every(Number.isFinite));calls.push(['setTransform',...args]);},
    drawImage(image,...args){assert.ok(image&&args.every(Number.isFinite));calls.push(['drawImage',...args]);}};
  for(const name of ['fillRect','strokeRect','moveTo','lineTo','arc','translate','rotate','rect'])context[name]=(...args)=>{assert.ok(args.every(Number.isFinite),name+' received nonfinite display geometry');calls.push([name,...args]);};
  for(const name of ['beginPath','stroke','fill','save','restore','clip'])context[name]=()=>calls.push([name]);
  context.fillText=(text,...args)=>{assert.equal(typeof text,'string');assert.ok(args.every(Number.isFinite));calls.push(['fillText',text,...args]);};
  return context;
}
function fixture() {
  const context=surface(),tiles=[],readouts=['time','grid','mode','range','diagnostics','probe','scope'].map(name=>element({dataset:{phaseInfo:name}}));
  const controls={'[data-phase-mode]':element({value:'phase'}),'[data-phase-vectors]':element(),'[data-phase-defects]':element(),'[data-phase-defect-label]':element()};
  const container={querySelector:selector=>controls[selector]||null,querySelectorAll:selector=>selector==='[data-phase-info]'?readouts:[]};
  const canvas=element({width:0,height:0,clientWidth:800,clientHeight:560,closest:()=>container,getContext:()=>context,focus(){this.focused=true;},getBoundingClientRect:()=>({left:0,top:0}),ownerDocument:{createElement(tag){assert.equal(tag,'canvas');const tile={width:0,height:0,context:surface(),getContext(){return this.context;}};tiles.push(tile);return tile;}}});
  return {view:new View(canvas),canvas,context,tiles,controls,readouts:Object.fromEntries(readouts.map(x=>[x.dataset.phaseInfo,x]))};
}
function pixel(texture,nx,ny,ix,iy) {const offset=((ny-1-iy)*nx+ix)*4;return Array.from(texture.data.slice(offset,offset+4));}
function constantComplex(f,re,im,defined=1) {
  const count=f.grid.nx*f.grid.ny;
  Object.assign(f.fields,{psiRe:Array(count).fill(re),psiIm:Array(count).fill(im),amplitude:Array(count).fill(Math.hypot(re,im)),phase:Array(count).fill(defined?Math.atan2(im,re):0),phaseDefined:Array(count).fill(defined)});
  f.defects=[];f.diagnostics.netWinding=0;return f;
}

test('production snapshots at all supported resolutions validate before and after actual evolution',()=>{
  for(const resolution of [16,32,64]) {
    const model=Core.createModel({resolution});
    for(const state of [model.snapshot(),model.step(.001)]) {
      const snapshot={...state,runId:'resolution-'+resolution,running:false};
      const checked=View.validateSnapshot(snapshot);
      assert.equal(checked.fields.density.length,resolution*resolution);
      assert.deepEqual(checked.defects,snapshot.defects);
      assert.deepEqual(checked.magneticDefects,snapshot.magneticDefects);
      assert.equal(checked.units.normalization.timeScaleSeconds,1);
      checked.fields.density[0]=999;assert.notEqual(snapshot.fields.density[0],999,'validation returns an independent numeric copy');
    }
  }
});
test('phase hue uses arg psi, brightness uses raw amplitude, and image row order has physical y upward',()=>{
  const f=constantComplex(frame({resolution:16}),3,0),nx=f.grid.nx,ny=f.grid.ny;
  f.fields.psiRe[0]=-3;f.fields.phase[0]=-Math.PI;
  f.fields.psiRe[nx]=0;f.fields.psiIm[nx]=3;f.fields.phase[nx]=Math.PI/2;
  const texture=View.createTexture(f);
  assert.deepEqual(pixel(texture,nx,ny,0,0),[255,61,61,255]);
  assert.deepEqual(pixel(texture,nx,ny,1,0),[61,255,255,255]);
  assert.deepEqual(pixel(texture,nx,ny,0,1),[158,61,255,255]);
  assert.equal(texture.scale.brightnessMaximum,3,'raw amplitude is retained rather than normalized');
  assert.deepEqual(Array.from(texture.data.slice((ny-1)*nx*4,(ny-1)*nx*4+4)),[255,61,61,255]);
  assert.match(texture.ordering,/y increases upward/);
});
test('zero fields stay undefined and dark; every view produces bounded RGBA from actual cell values',()=>{
  const f=constantComplex(frame({resolution:16}),0,0,0),count=f.fields.bx.length;
  Object.assign(f.fields,{bx:Array(count).fill(0),by:Array(count).fill(0),magneticStrength:Array(count).fill(0),magneticPhase:Array(count).fill(0),magneticPhaseDefined:Array(count).fill(0)});f.magneticDefects=[];
  for(const mode of ['phase','magneticPhase']) {
    const texture=View.createTexture(f,mode);
    for(let i=0;i<texture.data.length;i+=4)assert.deepEqual(Array.from(texture.data.slice(i,i+4)),[17,26,37,255]);
    assert.equal(texture.scale.brightnessMaximum,0);
  }
  for(const mode of View.MODES) {
    const texture=View.createTexture(f,mode);
    assert.equal(texture.data.length,count*4);
    for(let i=0;i<texture.data.length;i++)assert.ok(Number.isInteger(texture.data[i])&&texture.data[i]>=0&&texture.data[i]<=255);
  }
  assert.equal(View.createTexture(f,'complexPhase').mode,'phase');
});
test('iron colors are the declared four fractions, independent from the plasma thermal display',()=>{
  const f=frame({resolution:16}),m=f.materials.iron;
  for(const name of ['solidFraction','liquidFraction','vaporFraction','plasmaFraction'])m[name].fill(0);
  m.solidFraction.fill(1);m.solidFraction[1]=.5;m.liquidFraction[1]=.5;
  const texture=View.createTexture(f,'material');
  assert.deepEqual(pixel(texture,16,16,0,0),[111,136,165,255]);
  assert.deepEqual(pixel(texture,16,16,1,0),[183,161,121,255]);
  f.fields.temperatureK.fill(1e10);assert.deepEqual(View.createTexture(f,'material').data,texture.data,'material lab does not borrow plasma temperature colors');
});
test('invalid numeric, phase, unit, geometry, marker and metadata inputs preserve last accepted state',()=>{
  const h=fixture(),valid=frame({resolution:16},5);h.view.update(valid);const original=h.view.getTexture();
  const mutations=[
    f=>f.fields.density[0]=NaN,f=>f.fields.density[0]=0,f=>f.fields.psiRe[0]=Infinity,
    f=>f.fields.amplitude[0]+=1,f=>f.fields.phase[0]=4,f=>f.fields.phaseDefined[0]=.5,
    f=>f.materials.iron.solidFraction[0]=-.2,f=>{f.materials.iron.solidFraction[0]=1;f.materials.iron.liquidFraction[0]=1;},
    f=>f.units.normalization.timeScaleSeconds=0,f=>f.units.normalization.nucleiDensityM3=NaN,
    f=>f.units.magneticField=19,f=>f.diagnostics.nested={nonfinite:Infinity},f=>f.parameters.ironLengthM=0,
    f=>f.grid.ordering='column-major',f=>f.grid.dx*=2,f=>f.runId='',f=>f.sequence=-1,
    f=>f.magneticDefects=[{ix:16,iy:0,x:0,y:0,charge:1,resolved:true,minimumCornerAmplitude:1}],
    f=>f.defects=[{ix:0,iy:0,x:0,y:0,charge:1,resolved:'yes',minimumCornerAmplitude:1}]
  ];
  for(const change of mutations){const bad=structuredClone(valid);change(bad);assert.throws(()=>h.view.update(bad),RangeError);assert.equal(h.view.getStatus().sequence,5);assert.deepEqual(h.view.getTexture().data,original.data);}
  assert.throws(()=>h.view.update(valid,'unsupported'),RangeError);assert.equal(h.view.getStatus().mode,'phase');
  assert.match(h.readouts.diagnostics.textContent,/Frame rejected/);
  h.view.update(valid);assert.equal(h.view.getStatus().error,null);
});
test('late sequences and retired runs cannot replace current cells; a fresh reset keeps chosen mode',()=>{
  const h=fixture(),a=frame({resolution:16},8,'first-run');h.view.update(a);h.view.setMode('density');
  const late=constantComplex(frame({resolution:16},7,'first-run'),99,0);
  assert.equal(h.view.update(late).accepted,false);assert.equal(h.view.getStatus().sequence,8);
  const fresh=frame({resolution:16},0,'reset-run');assert.equal(h.view.update(fresh).accepted,true);assert.equal(h.view.getStatus().mode,'density');
  assert.equal(h.view.update({...a,sequence:100}).reason,'retired-run');assert.equal(h.view.getStatus().runId,'reset-run');assert.equal(h.view.getStatus().sequence,0);
  assert.equal(h.view.getStatus().staleFramesIgnored,2);
  assert.equal(h.view.update({...fresh,running:true}).accepted,true,'pause/play metadata may change at the same sequence');
  h.view.reset();assert.equal(h.view.getStatus().ready,false);assert.equal(h.view.update(a).accepted,true,'explicit view reset forgets prior runs');
});
test('magnetic views plot actual magnetic winding; material view suppresses all plasma overlays and uses iron metres',()=>{
  const h=fixture(),f=frame({resolution:16});h.view.update(f);assert.equal(h.view.getStatus().defects,f.defects.length);
  h.view.setMode('magneticPhase');assert.equal(h.view.getStatus().defects,f.magneticDefects.length);assert.match(h.view.getStatus().defectSource,/magnetic/);assert.equal(h.controls['[data-phase-defect-label]'].textContent,'Magnetic winding');
  h.view.setOverlays({magnetic:false});h.context.calls.length=0;h.view.render();
  const arcs=h.context.calls.filter(x=>x[0]==='arc');assert.equal(arcs.length,f.magneticDefects.length);
  for(let i=0;i<arcs.length;i++){const d=f.magneticDefects[i],p=h.view.plot;assert.ok(Math.abs(arcs[i][1]-(p.x+(d.x%f.grid.length)/f.grid.length*p.size))<1e-10);assert.ok(Math.abs(arcs[i][2]-(p.y+(1-(d.y%f.grid.length)/f.grid.length)*p.size))<1e-10);}
  h.view.setOverlays({magnetic:true,velocity:true});h.context.calls.length=0;h.view.setMode('material');
  assert.deepEqual(h.view.getStatus().overlays,{magnetic:false,velocity:false,defects:false});
  assert.equal(h.view.getStatus().defects,0);assert.equal(h.context.calls.filter(x=>x[0]==='arc').length,0);
  assert.ok(h.context.calls.some(x=>x[0]==='fillText'&&x[1]==='x / m · iron lab · periodic'));
  assert.equal(h.controls['[data-phase-defects]'].disabled,true);assert.match(h.readouts.diagnostics.textContent,/Iron heat-balance/);
});
test('probes use actual cell centers, periodic endpoints and arrow-key wrapping; copies cannot change the frame',()=>{
  const h=fixture(),f=frame({resolution:16});h.view.update(f);
  const probe=h.view.inspectCell(2,3),index=3*16+2;
  assert.equal(probe.x,2.5*f.grid.dx);assert.equal(probe.y,3.5*f.grid.dy);assert.equal(probe.psi.re,f.fields.psiRe[index]);assert.equal(probe.magnetic.x,f.fields.bx[index]);
  assert.equal(h.view.inspect(f.grid.length,f.grid.length).index,0);
  assert.equal(h.view.inspect(f.grid.length*(1-Number.EPSILON),f.grid.length*(1-Number.EPSILON)).index,255);
  assert.throws(()=>h.view.inspectCell(-1,0),RangeError);assert.throws(()=>h.view.inspect(-1,0),RangeError);
  h.canvas.emit('keydown',{key:'Home'});h.canvas.emit('keydown',{key:'ArrowLeft'});assert.equal(h.view.selection.ix,15);
  h.canvas.emit('keydown',{key:'ArrowDown'});assert.equal(h.view.selection.iy,15);assert.match(h.readouts.probe.textContent,/Cell \(15, 15\)/);
  h.canvas.emit('pointerdown',{clientX:h.view.plot.x+.1,clientY:h.view.plot.y+.1});assert.equal(h.view.selection.ix,0);assert.equal(h.view.selection.iy,15);assert.equal(h.canvas.focused,true);
  const texture=h.view.getTexture();texture.data.fill(0);texture.scale.minimum=999;probe.units.normalization.timeScaleSeconds=999;
  assert.ok(h.view.getTexture().data.some(x=>x!==0));assert.equal(h.view.inspectCell(2,3).units.normalization.timeScaleSeconds,1);assert.equal(h.canvas.width,800);
  const tileImage=h.tiles[0].context.image.data;h.view.render();assert.equal(h.tiles[0].context.image.data,tileImage,'unchanged rendering reuses calculated-cell pixels');
});
test('view-only controls preserve frame values and scientific scope; destroy removes handlers and rejects further frames',()=>{
  const h=fixture(),f=frame({resolution:16});h.view.update(f);const psi=h.view.inspectCell(0,0).psi;
  h.controls['[data-phase-mode]'].value='temperature';h.controls['[data-phase-mode]'].emit('change');assert.equal(h.view.getStatus().mode,'temperature');assert.deepEqual(h.view.inspectCell(0,0).psi,psi);
  h.controls['[data-phase-vectors]'].checked=false;h.controls['[data-phase-vectors]'].emit('change');assert.equal(h.view.getStatus().overlays.magnetic,false);
  h.view.setMode('phase');assert.match(h.view.getStatus().scientificScope,/not a quantum condensate/);
  h.view.setMode('material');assert.match(h.view.getStatus().scientificScope,/isobaric iron/);
  assert.throws(()=>h.view.setOverlays({unknown:true}),RangeError);
  h.view.destroy();assert.equal(h.view.getStatus().destroyed,true);assert.equal(h.canvas.listeners.pointermove.length,0);assert.throws(()=>h.view.update(f),/destroyed/);
});
