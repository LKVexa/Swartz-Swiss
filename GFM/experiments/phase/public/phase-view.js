/* Computed-cell Canvas2D view. Color encoding changes presentation only.
 * No solver, spatial interpolation, optical emission or generated texture is
 * substituted for the backend's local MHD/order-parameter/material fields. */
(function (root) {
  'use strict';
  const TAU=2*Math.PI, SCHEMA='GFM-Phase-MHD-frame/1';
  const FIELD_NAMES=['density','temperature','temperatureK','vx','vy','bx','by','magneticStrength','currentZ','electricZ','psiRe','psiIm','phase','amplitude','magneticPhase','hydrogenIonization','phaseDefined','magneticPhaseDefined'];
  const IRON_NAMES=['temperatureK','enthalpyJkg','solidFraction','liquidFraction','vaporFraction','plasmaFraction'];
  const MODES=Object.freeze(['phase','amplitude','density','temperature','magnetic','magneticPhase','ionization','material']);
  const MODE_LABELS={phase:'Complex phase + amplitude',amplitude:'Order-parameter amplitude',density:'Plasma density',temperature:'Plasma temperature',magnetic:'Magnetic strength',magneticPhase:'Magnetic direction + strength',ionization:'Hydrogen ionization estimate',material:'Iron material fractions · separate lab'};
  const MATERIAL_COLORS=[[111,136,165],[255,186,76],[92,208,224],[229,96,204]];
  const PALETTES={density:[[27,20,63],[54,68,130],[28,128,145],[82,185,139],[234,224,105]],temperature:[[29,23,57],[104,47,106],[191,63,88],[244,132,72],[255,235,159]],magnetic:[[12,29,52],[29,79,121],[34,149,178],[117,218,220],[224,251,243]],amplitude:[[12,26,43],[28,91,121],[60,160,165],[169,230,203],[249,247,211]],ionization:[[28,34,56],[60,86,133],[75,145,194],[127,201,221],[220,246,250]]};
  const finite=x=>typeof x==='number'&&Number.isFinite(x);
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const require=(condition,message)=>{if(!condition)throw new RangeError(message);};
  const clone=value=>typeof root.structuredClone==='function'?root.structuredClone(value):JSON.parse(JSON.stringify(value));
  function metadata(value,name,depth=0,budget={remaining:4096}) {
    require(depth<=8&&--budget.remaining>=0,'Oversized field metadata: '+name);
    if(value===null||typeof value==='boolean')return value;
    if(typeof value==='number'){require(finite(value),'Nonfinite field metadata: '+name);return value;}
    if(typeof value==='string'){require(value.length<=5000,'Oversized field metadata string: '+name);return value;}
    require(value&&typeof value==='object','Invalid field metadata: '+name);
    if(Array.isArray(value))return value.map((v,i)=>metadata(v,name+'['+i+']',depth+1,budget));
    const result={};
    for(const key of Object.keys(value)){const descriptor=Object.getOwnPropertyDescriptor(value,key);require(key.length<=128&&Object.hasOwn(descriptor,'value'),'Invalid field metadata property: '+name);Object.defineProperty(result,key,{value:metadata(descriptor.value,name+'.'+key,depth+1,budget),enumerable:true,writable:true,configurable:true});}
    return result;
  }
  const fmt=value=>value===0?'0':Math.abs(value)<.001||Math.abs(value)>=1e5?value.toExponential(3):value.toPrecision(5);
  function modeName(value) {const m=value==='complexPhase'?'phase':value;require(MODES.includes(m),'Unsupported field view: '+String(value));return m;}
  function array(value,count,name,low=-1e15,high=1e15) {
    require(Array.isArray(value)&&value.length===count,name+' must contain one numeric value per cell.');
    require(value.every(x=>finite(x)&&x>=low&&x<=high),name+' contains nonfinite or out-of-range data.');return value.slice();
  }
  function validateSnapshot(snapshot) {
    require(snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot)&&snapshot.schema===SCHEMA,'Unsupported calculated-field frame.');
    require(typeof snapshot.runId==='string'&&snapshot.runId.length>0&&snapshot.runId.length<=128,'Calculated-field frame requires a bounded runId.');
    require(Number.isSafeInteger(snapshot.sequence)&&snapshot.sequence>=0,'Field sequence must be a nonnegative safe integer.');
    require(finite(snapshot.time)&&snapshot.time>=0&&snapshot.time<=1e12,'Field time is invalid.');
    const g=snapshot.grid;
    require(g&&Number.isInteger(g.nx)&&Number.isInteger(g.ny)&&g.nx>=4&&g.ny>=4&&g.nx<=128&&g.ny<=128,'Field grid must be 4..128 cells per axis.');
    require(g.ordering==='x-fast row-major'&&g.boundary==='periodic'&&g.dimension===2,'Expected a periodic, two-dimensional row-major local box.');
    require(finite(g.length)&&g.length>0&&g.length<=1e9&&finite(g.dx)&&g.dx>0&&finite(g.dy)&&g.dy>0,'Invalid local grid dimensions.');
    require(Math.abs(g.dx*g.nx-g.length)<=1e-10*Math.max(g.length,1e-12)&&Math.abs(g.dy*g.ny-g.length)<=1e-10*Math.max(g.length,1e-12),'Grid spacing differs from the declared box length.');
    const count=g.nx*g.ny,fields={},iron={};
    require(snapshot.fields&&typeof snapshot.fields==='object','Calculated field arrays are missing.');
    for(const name of FIELD_NAMES){const positive=['density','temperature','temperatureK','amplitude','magneticStrength'].includes(name),fraction=name==='hydrogenIonization',flag=name.endsWith('Defined');fields[name]=array(snapshot.fields[name],count,'fields.'+name,positive||fraction||flag?0:-1e15,fraction||flag?1:1e15);if(flag)require(fields[name].every(x=>x===0||x===1),name+' must use binary definition markers.');}
    require(fields.density.every(x=>x>0),'Plasma density must be positive.');
    const material=snapshot.materials?.iron;require(material&&typeof material==='object','Separate iron reference arrays are missing.');
    for(const name of IRON_NAMES)iron[name]=array(material[name],count,'materials.iron.'+name,name.endsWith('Fraction')||name==='temperatureK'?0:-1e15,name.endsWith('Fraction')?1:1e15);
    for(let i=0;i<count;i++) {
      const amp=Math.hypot(fields.psiRe[i],fields.psiIm[i]),strength=Math.hypot(fields.bx[i],fields.by[i]);
      require(Math.abs(fields.amplitude[i]-amp)<=1e-8*Math.max(1,amp),'Amplitude differs from the supplied complex field at cell '+i+'.');
      require(Math.abs(fields.magneticStrength[i]-strength)<=1e-8*Math.max(1,strength),'Magnetic strength differs from its components at cell '+i+'.');
      for(const [phase,defined,x,y,mag]of [['phase','phaseDefined','psiRe','psiIm',amp],['magneticPhase','magneticPhaseDefined','bx','by',strength]]){
        require(Math.abs(fields[phase][i])<=Math.PI+1e-10,'Phase is outside the declared angle range.');
        if(fields[defined][i]===1){require(mag>0,'A zero field cannot have a defined phase.');const delta=fields[phase][i]-Math.atan2(fields[y][i],fields[x][i]);require(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<=1e-7,'Reported phase differs from the field at cell '+i+'.');}
      }
      require(Math.abs(iron.solidFraction[i]+iron.liquidFraction[i]+iron.vaporFraction[i]+iron.plasmaFraction[i]-1)<=1e-8,'Iron reference fractions do not partition unity at cell '+i+'.');
    }
    const validateDefects=(values,name)=>{require(Array.isArray(values)&&values.length<=count,'Invalid bounded '+name+' markers.');return values.map(d=>{
      require(d&&Number.isInteger(d.ix)&&d.ix>=0&&d.ix<g.nx&&Number.isInteger(d.iy)&&d.iy>=0&&d.iy<g.ny,'Defect cell index is outside the grid.');
      require(finite(d.x)&&d.x>=0&&d.x<=g.length&&finite(d.y)&&d.y>=0&&d.y<=g.length,'Defect position is outside the local box.');
      require(Number.isInteger(d.charge)&&Math.abs(d.charge)<=4&&d.charge!==0&&typeof d.resolved==='boolean'&&finite(d.minimumCornerAmplitude)&&d.minimumCornerAmplitude>=0,'Invalid defect charge/amplitude/definition marker.');
      return {ix:d.ix,iy:d.iy,x:d.x,y:d.y,charge:d.charge,resolved:d.resolved,minimumCornerAmplitude:d.minimumCornerAmplitude};
    });};
    const defects=validateDefects(snapshot.defects,'complex phase defect'),magneticDefects=validateDefects(snapshot.magneticDefects,'magnetic direction defect');
    require(snapshot.units&&typeof snapshot.units==='object'&&snapshot.scopes&&typeof snapshot.scopes==='object','Field units and scientific scopes are required.');
    for(const name of ['mhd','complexPhase','magneticPhase','ionization','iron','geometry'])require(typeof snapshot.scopes[name]==='string'&&snapshot.scopes[name].length>0&&snapshot.scopes[name].length<=5000,'Scientific scope is missing: '+name);
    const units=metadata(snapshot.units,'units'),diagnostics=metadata(snapshot.diagnostics||{},'diagnostics'),parameters=metadata(snapshot.parameters||{},'parameters');
    for(const name of ['time','density','temperature','temperatureK','velocity','magneticField','electricField','current','ironTemperature','ironEnthalpy'])require(typeof units[name]==='string'&&units[name].length>0&&units[name].length<=500,'Unit convention is missing: '+name);
    require(units.normalization&&typeof units.normalization==='object'&&!Array.isArray(units.normalization),'Unit normalization is missing.');
    for(const name of ['temperatureScaleK','nucleiDensityM3','timeScaleSeconds','velocityMps','lengthM','densityKgM3','magneticTesla'])require(finite(units.normalization[name])&&units.normalization[name]>0&&units.normalization[name]<=1e100,'Invalid unit normalization: '+name);
    require(finite(parameters.ironLengthM)&&parameters.ironLengthM>0&&parameters.ironLengthM<=1e9,'Separate iron-lab length is missing or invalid.');
    return {schema:SCHEMA,runId:snapshot.runId,sequence:snapshot.sequence,time:snapshot.time,running:snapshot.running===true,
      grid:{...g},fields,materials:{iron:{...iron,scope:typeof material.scope==='string'?material.scope:snapshot.scopes.iron}},defects,magneticDefects,diagnostics,units,scopes:{...snapshot.scopes},parameters};
  }
  function extrema(values) {let min=Infinity,max=-Infinity;for(const v of values){min=Math.min(min,v);max=Math.max(max,v);}return {min,max};}
  function hsv(h,s,v) {h=((h%1)+1)%1;const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s),rgb=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];return rgb.map(x=>Math.round(255*x));}
  function palette(name,t) {const stops=PALETTES[name]||PALETTES.density,pos=clamp(t,0,1)*(stops.length-1),i=Math.min(stops.length-2,Math.floor(pos)),f=pos-i;return stops[i].map((x,c)=>Math.round(x+(stops[i+1][c]-x)*f));}
  function scaleFor(frame,mode) {
    const f=frame.fields;
    if(mode==='phase'||mode==='magneticPhase')return {minimum:-Math.PI,maximum:Math.PI,units:'rad',kind:'fixed phase hue',brightnessMaximum:extrema(mode==='phase'?f.amplitude:f.magneticStrength).max,brightnessUnits:mode==='phase'?'|ψ|':frame.units.magneticField||'B0'};
    if(mode==='material')return {minimum:0,maximum:1,units:'fraction',kind:'four material fractions; fixed colors',colors:MATERIAL_COLORS.map(x=>x.slice())};
    const name={amplitude:'amplitude',density:'density',temperature:'temperatureK',magnetic:'magneticStrength',ionization:'hydrogenIonization'}[mode],range=extrema(f[name]),fixed=mode==='ionization';
    return {minimum:fixed||mode==='amplitude'||mode==='magnetic'?0:range.min,maximum:fixed?1:range.max,units:{amplitude:'|ψ| (phenomenological)',density:frame.units.density||'rho0',temperature:'K',magnetic:frame.units.magneticField||'B0',ionization:'fraction (LTE estimate)'}[mode],kind:fixed?'fixed 0..1':'frame range',field:name};
  }
  function colorCell(frame,mode,index,scale) {
    const f=frame.fields;
    if(mode==='material'){const m=frame.materials.iron,weights=[m.solidFraction[index],m.liquidFraction[index],m.vaporFraction[index],m.plasmaFraction[index]];return [0,1,2].map(c=>Math.round(weights.reduce((sum,w,i)=>sum+w*MATERIAL_COLORS[i][c],0)));}
    if(mode==='phase'||mode==='magneticPhase'){
      const defined=mode==='phase'?f.phaseDefined[index]:f.magneticPhaseDefined[index];if(!defined)return [17,26,37];
      const angle=mode==='phase'?f.phase[index]:f.magneticPhase[index],magnitude=mode==='phase'?f.amplitude[index]:f.magneticStrength[index],brightness=scale.brightnessMaximum>0?.12+.88*magnitude/scale.brightnessMaximum:.12;
      return hsv((angle+Math.PI)/TAU,.76,clamp(brightness,0,1));
    }
    const span=scale.maximum-scale.minimum,t=span>0?(f[scale.field][index]-scale.minimum)/span:.5;return palette(mode,t);
  }
  function makeTexture(frame,mode) {
    const scale=scaleFor(frame,mode),{nx,ny}=frame.grid,data=new Uint8ClampedArray(nx*ny*4);
    for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){const index=iy*nx+ix,out=((ny-1-iy)*nx+ix)*4,color=colorCell(frame,mode,index,scale);data[out]=color[0];data[out+1]=color[1];data[out+2]=color[2];data[out+3]=255;}
    return {width:nx,height:ny,data,mode,scale,ordering:'top-left image; physical y increases upward',sourceOrdering:frame.grid.ordering,scope:'One pixel per computed cell. Nearest-cell display; no spatial interpolation or invented microstructure.'};
  }
  class PhaseTextureView {
    constructor(canvas) {
      require(canvas&&typeof canvas.getContext==='function','PhaseTextureView requires a canvas.');
      this.canvas=canvas;this.context=canvas.getContext('2d',{alpha:false});require(this.context,'The field view requires Canvas2D; numerical exports remain available.');
      this.frame=null;this.mode='phase';this.texture=null;this.tile=null;this.error=null;this.destroyed=false;this.selection=null;this.plot=null;this.listeners=[];this.overlays={magnetic:true,defects:true,velocity:false};this.staleFrames=0;
      this.retiredRuns=new Set();this.container=canvas.closest?.('.phase-lab')||null;this.readouts=this.container?[...this.container.querySelectorAll('[data-phase-info]')]:[];
      this.bindControls();
      this.on(canvas,'pointermove',event=>this.pointer(event));this.on(canvas,'pointerdown',event=>{this.pointer(event);canvas.focus?.();});
      this.on(canvas,'keydown',event=>{if(!this.frame||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();const {nx,ny}=this.frame.grid,s=this.selection||{ix:0,iy:0};let ix=s.ix,iy=s.iy;if(event.key==='ArrowLeft')ix--;if(event.key==='ArrowRight')ix++;if(event.key==='ArrowUp')iy++;if(event.key==='ArrowDown')iy--;if(event.key==='Home'){ix=0;iy=0;}this.selection={ix:(ix+nx)%nx,iy:(iy+ny)%ny};this.render();this.updateReadouts();});
      if(typeof root.ResizeObserver==='function'){this.resizeObserver=new root.ResizeObserver(()=>this.render());this.resizeObserver.observe(canvas);}this.render();
    }
    on(target,name,handler,options) {target.addEventListener(name,handler,options);this.listeners.push([target,name,handler,options]);}
    bindControls() {
      if(!this.container)return;
      this.modeControl=this.container.querySelector('[data-phase-mode]');if(this.modeControl)this.on(this.modeControl,'change',()=>this.setMode(this.modeControl.value));
      for(const [key,attribute]of [['magnetic','vectors'],['defects','defects']]){const control=this.container.querySelector('[data-phase-'+attribute+']');if(control){this.overlays[key]=control.checked;this.on(control,'change',()=>this.setOverlays({[key]:control.checked}));}}
    }
    update(snapshot,mode=this.mode) {
      if(this.destroyed)throw new Error('The field view was destroyed.');
      let frame,newMode;
      try{newMode=modeName(mode);frame=validateSnapshot(snapshot);}catch(error){this.error=error.message;this.render();this.updateReadouts();throw error;}
      if(this.frame&&frame.runId===this.frame.runId&&frame.sequence<this.frame.sequence){this.staleFrames++;return {accepted:false,reason:'stale',runId:this.frame.runId,sequence:this.frame.sequence};}
      if(this.retiredRuns.has(frame.runId)){this.staleFrames++;return {accepted:false,reason:'retired-run',runId:this.frame.runId,sequence:this.frame.sequence};}
      if(this.frame&&frame.runId!==this.frame.runId){this.retiredRuns.add(this.frame.runId);if(this.retiredRuns.size>1024)this.retiredRuns.delete(this.retiredRuns.values().next().value);}
      if(!this.frame||frame.runId!==this.frame.runId||frame.grid.nx!==this.frame.grid.nx||frame.grid.ny!==this.frame.grid.ny)this.selection=null;
      this.frame=frame;this.mode=newMode;this.error=null;this.texture=makeTexture(frame,newMode);this.uploadTexture();this.render();this.updateReadouts();return {accepted:true,runId:frame.runId,sequence:frame.sequence};
    }
    uploadTexture() {
      const texture=this.texture,document=this.canvas.ownerDocument||root.document;
      if(!this.tile||this.tile.width!==texture.width||this.tile.height!==texture.height){this.tile=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(texture.width,texture.height):document?.createElement?.('canvas');require(this.tile,'No cell texture surface is available.');this.tile.width=texture.width;this.tile.height=texture.height;}
      const ctx=this.tile.getContext('2d'),image=ctx.createImageData(texture.width,texture.height);image.data.set(texture.data);ctx.putImageData(image,0,0);
    }
    setMode(mode) {this.mode=modeName(mode);if(this.frame){this.texture=makeTexture(this.frame,this.mode);this.uploadTexture();}this.render();this.updateReadouts();return this.getStatus();}
    setOverlays(patch) {require(patch&&typeof patch==='object'&&!Array.isArray(patch),'Invalid field overlay settings.');for(const [key,value]of Object.entries(patch))require(Object.hasOwn(this.overlays,key)&&typeof value==='boolean','Unknown or nonboolean overlay setting.');Object.assign(this.overlays,patch);this.render();return this.getStatus();}
    reset() {this.frame=null;this.texture=null;this.selection=null;this.error=null;this.staleFrames=0;this.retiredRuns.clear();this.render();this.updateReadouts();}
    inspectCell(ix,iy) {
      if(!this.frame)return null;const {nx,ny,dx,dy}=this.frame.grid;require(Number.isInteger(ix)&&ix>=0&&ix<nx&&Number.isInteger(iy)&&iy>=0&&iy<ny,'Probe cell is outside the calculated grid.');const index=iy*nx+ix,f=this.frame.fields,iron=this.frame.materials.iron;
      return {runId:this.frame.runId,sequence:this.frame.sequence,index,ix,iy,x:(ix+.5)*dx,y:(iy+.5)*dy,
        density:f.density[index],temperature:f.temperature[index],temperatureK:f.temperatureK[index],velocity:{x:f.vx[index],y:f.vy[index]},magnetic:{x:f.bx[index],y:f.by[index],strength:f.magneticStrength[index],phase:f.magneticPhaseDefined[index]?f.magneticPhase[index]:null},
        psi:{re:f.psiRe[index],im:f.psiIm[index],amplitude:f.amplitude[index],phase:f.phaseDefined[index]?f.phase[index]:null},currentZ:f.currentZ[index],electricZ:f.electricZ[index],hydrogenIonization:f.hydrogenIonization[index],
        iron:Object.fromEntries(IRON_NAMES.map(name=>[name,iron[name][index]])),units:clone(this.frame.units)};
    }
    inspect(x,y) {if(!this.frame)return null;const g=this.frame.grid;require(finite(x)&&finite(y)&&x>=0&&x<=g.length&&y>=0&&y<=g.length,'Probe coordinates are outside the local box.');return this.inspectCell(Math.min(g.nx-1,Math.floor((x%g.length)/g.dx)),Math.min(g.ny-1,Math.floor((y%g.length)/g.dy)));}
    pointer(event) {if(!this.frame||!this.plot||typeof this.canvas.getBoundingClientRect!=='function')return;const rect=this.canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,p=this.plot;if(x<p.x||y<p.y||x>=p.x+p.size||y>=p.y+p.size)return;const g=this.frame.grid;this.selection={ix:Math.min(g.nx-1,Math.floor((x-p.x)/p.size*g.nx)),iy:Math.min(g.ny-1,Math.floor((1-(y-p.y)/p.size)*g.ny))};this.render();this.updateReadouts();}
    getTexture() {return this.texture?{...this.texture,data:this.texture.data.slice(),scale:clone(this.texture.scale),runId:this.frame.runId,sequence:this.frame.sequence}:null;}
    getStatus() {return {ready:!!this.frame,error:this.error,mode:this.mode,label:MODE_LABELS[this.mode],runId:this.frame?.runId||null,sequence:this.frame?.sequence??null,grid:this.frame?{...this.frame.grid}:null,staleFramesIgnored:this.staleFrames,colorScale:this.texture?clone(this.texture.scale):null,nearestCellRendering:true,
      overlays:{magnetic:this.mode!=='material'&&this.overlays.magnetic,velocity:this.mode!=='material'&&this.overlays.velocity,defects:this.mode!=='material'&&this.overlays.defects},defectSource:this.defectSource(),defects:this.activeDefects().length,resolvedDefects:this.activeDefects().filter(x=>x.resolved).length,retiredRunsRemembered:this.retiredRuns.size,scientificScope:this.scope(),destroyed:this.destroyed};}
    defectSource() {return this.mode==='material'?'none':this.mode==='magnetic'||this.mode==='magneticPhase'?'in-plane magnetic direction':'complex order-parameter phase';}
    activeDefects() {return !this.frame||this.mode==='material'?[]:this.mode==='magnetic'||this.mode==='magneticPhase'?this.frame.magneticDefects:this.frame.defects;}
    scope() {if(!this.frame)return 'Waiting for calculated local-box data; no texture is generated.';const s=this.frame.scopes,key=this.mode==='phase'||this.mode==='amplitude'?'complexPhase':this.mode==='magneticPhase'?'magneticPhase':this.mode==='ionization'?'ionization':this.mode==='material'?'iron':'mhd';return s[key]+' '+s.geometry;}
    updateReadouts() {
      if(this.modeControl)this.modeControl.value=this.mode;
      if(this.container)for(const selector of ['[data-phase-vectors]','[data-phase-defects]']){const node=this.container.querySelector(selector);if(node)node.disabled=this.mode==='material';}
      const defectLabel=this.container?.querySelector('[data-phase-defect-label]');if(defectLabel)defectLabel.textContent=this.mode==='magnetic'||this.mode==='magneticPhase'?'Magnetic winding':'Complex phase defects';
      const frame=this.frame,scale=this.texture?.scale,probe=this.selection?this.inspectCell(this.selection.ix,this.selection.iy):null;
      const diagnostics=frame?.diagnostics||{},timeScale=frame?.units?.normalization?.timeScaleSeconds;
      const netWinding=this.mode==='magnetic'||this.mode==='magneticPhase'?diagnostics.magneticNetWinding:diagnostics.netWinding;
      const phaseMode=this.mode==='phase'||this.mode==='magneticPhase';
      const text={mode:MODE_LABELS[this.mode],time:frame?fmt(frame.time)+' L₀/v₀'+(finite(timeScale)?' · '+fmt(frame.time*timeScale)+' s':'' ):'—',grid:frame?frame.grid.nx+' × '+frame.grid.ny+' · periodic':'—',range:scale?(this.mode==='material'?'Four fractions · 0…1':fmt(scale.minimum)+'…'+fmt(scale.maximum)+' '+scale.units+' · '+scale.kind+(phaseMode?'\nBrightness: 0…'+fmt(scale.brightnessMaximum)+' '+scale.brightnessUnits:'')):'—',
        scope:this.scope(),diagnostics:frame?(this.mode==='material'?['Iron heat-balance residual: '+(finite(diagnostics.ironBalanceErrorJkg)?fmt(diagnostics.ironBalanceErrorJkg)+' J/kg':'not reported'),'Minimum iron T: '+(finite(diagnostics.minIronTemperatureK)?fmt(diagnostics.minIronTemperatureK)+' K':'not reported'),'Separate laboratory · no plasma phase-mixture EOS'].join('\n'):['Mass Δ: '+(finite(diagnostics.relativeMassError)?fmt(diagnostics.relativeMassError):'not reported'),'Energy Δ: '+(finite(diagnostics.relativeEnergyError)?fmt(diagnostics.relativeEnergyError):'not reported'),'max |∇·B|: '+(finite(diagnostics.maxDivB)?fmt(diagnostics.maxDivB):'not reported'),this.defectSource()+' markers: '+this.activeDefects().length+' · net '+(Number.isInteger(netWinding)?netWinding:'not reported'),'Unresolved markers use “?”; no subcell vortex fitting'].join('\n')):'Waiting for a field frame.',probe:probe?this.probeText(probe):'Point to a calculated cell.'};
      if(this.error)text.diagnostics='Frame rejected: '+this.error+'\nShowing last accepted frame '+(frame?.sequence??'none')+'.';
      for(const node of this.readouts)node.textContent=text[node.dataset.phaseInfo]||'—';
    }
    probeText(p) {
      if(this.mode==='material')return 'Cell ('+p.ix+', '+p.iy+') · separate iron lab\nT = '+fmt(p.iron.temperatureK)+' K\nh = '+fmt(p.iron.enthalpyJkg)+' J/kg\nSolid '+fmt(100*p.iron.solidFraction)+'%\nLiquid '+fmt(100*p.iron.liquidFraction)+'%\nNeutral vapor '+fmt(100*p.iron.vaporFraction)+'%\nIonized '+fmt(100*p.iron.plasmaFraction)+'%';
      return 'Cell ('+p.ix+', '+p.iy+') · x='+fmt(p.x)+', y='+fmt(p.y)+'\nρ = '+fmt(p.density)+' '+(p.units.density||'rho0')+'\nT = '+fmt(p.temperatureK)+' K\nB = ('+fmt(p.magnetic.x)+', '+fmt(p.magnetic.y)+')\n|B| = '+fmt(p.magnetic.strength)+' '+(p.units.magneticField||'B0')+'\nψ = '+fmt(p.psi.re)+(p.psi.im<0?' − ':' + ')+fmt(Math.abs(p.psi.im))+'i\n|ψ| = '+fmt(p.psi.amplitude)+'\narg ψ = '+(p.psi.phase===null?'undefined':fmt(p.psi.phase)+' rad')+'\nHydrogen ionization = '+fmt(p.hydrogenIonization);
    }
    drawVectors(c,p,key) {
      const f=this.frame.fields,{nx,ny}=this.frame.grid,xkey=key==='magnetic'?'bx':'vx',ykey=key==='magnetic'?'by':'vy',stride=Math.max(1,Math.ceil(Math.max(nx,ny)/11));let max=0;for(let i=0;i<nx*ny;i++)max=Math.max(max,Math.hypot(f[xkey][i],f[ykey][i]));if(max===0)return;
      c.strokeStyle=key==='magnetic'?'rgba(226,247,251,.68)':'rgba(255,209,144,.7)';c.lineWidth=1;
      for(let iy=Math.floor(stride/2);iy<ny;iy+=stride)for(let ix=Math.floor(stride/2);ix<nx;ix+=stride){const i=iy*nx+ix,x=p.x+(ix+.5)/nx*p.size,y=p.y+(1-(iy+.5)/ny)*p.size,vx=f[xkey][i],vy=-f[ykey][i],mag=Math.hypot(vx,vy);if(mag===0)continue;const length=p.size/Math.max(nx,ny)*stride*.7*mag/max,dx=vx/mag*length,dy=vy/mag*length,tipx=x+dx*.5,tipy=y+dy*.5;c.beginPath();c.moveTo(x-dx*.5,y-dy*.5);c.lineTo(tipx,tipy);const head=Math.min(4,length*.4),ux=vx/mag,uy=vy/mag;c.moveTo(tipx-head*(ux-.5*uy),tipy-head*(uy+.5*ux));c.lineTo(tipx,tipy);c.lineTo(tipx-head*(ux+.5*uy),tipy-head*(uy-.5*ux));c.stroke();}
    }
    drawDefects(c,p) {
      c.font='bold 9px Consolas,monospace';c.textAlign='center';c.textBaseline='middle';
      for(const d of this.activeDefects()){const x=p.x+(d.x%this.frame.grid.length)/this.frame.grid.length*p.size,y=p.y+(1-(d.y%this.frame.grid.length)/this.frame.grid.length)*p.size;c.strokeStyle=d.resolved?(d.charge>0?'#f8f6d7':'#f5bcce'):'#8997aa';c.fillStyle='rgba(5,13,24,.8)';c.lineWidth=1.4;c.beginPath();c.arc(x,y,6,0,TAU);c.fill();c.stroke();c.fillStyle=c.strokeStyle;c.fillText(d.resolved?(d.charge>0?'+':'−'):'?',x,y+.4);}c.textBaseline='alphabetic';
    }
    drawLegend(c,p,width) {
      const scale=this.texture.scale,x=p.x+p.size+20,y=p.y,h=p.size;
      if(this.mode==='material'){c.font='9px Consolas,monospace';c.textAlign='left';['Solid','Liquid','Neutral','Ionized'].forEach((name,i)=>{c.fillStyle='rgb('+MATERIAL_COLORS[i].join(',')+')';c.fillRect(x,y+20+i*51,12,24);c.fillStyle='#a7c2d0';c.fillText(name,x-2,y+56+i*51);});return;}
      const slices=Math.max(1,Math.ceil(h));for(let i=0;i<slices;i++){const t=1-i/(slices-1||1),color=this.mode==='phase'||this.mode==='magneticPhase'?hsv(t,.76,1):palette(this.mode,t);c.fillStyle='rgb('+color.join(',')+')';c.fillRect(x,y+i*h/slices,13,h/slices+1);}c.strokeStyle='#314857';c.strokeRect(x,y,13,h);c.fillStyle='#a8bfcd';c.font='9px Consolas,monospace';c.textAlign='left';const phase=this.mode==='phase'||this.mode==='magneticPhase';c.fillText(phase?'+π':fmt(scale.maximum),x-2,y-8);c.fillText(phase?'−π':fmt(scale.minimum),x-2,y+h+15);c.fillStyle='#7693a7';c.fillText(phase?'rad':this.mode==='temperature'?'K':this.mode==='ionization'?'0…1':'scale',x-2,y+h+29);
      if(width<360)return;c.save();c.translate(x+39,y+h*.5);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText(phase?'Phase hue · brightness scaled to max '+scale.brightnessUnits:scale.kind,0,0);c.restore();
    }
    render() {
      if(this.destroyed)return;const canvas=this.canvas,c=this.context,dpr=clamp(root.devicePixelRatio||1,1,2),w=canvas.clientWidth||0,h=canvas.clientHeight||0;if(w<2||h<2)return;const pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#07101b';c.fillRect(0,0,w,h);c.font='11px Consolas,monospace';c.textAlign='left';c.fillStyle='#c0d8e4';c.fillText(MODE_LABELS[this.mode],22,25);c.font='9px Consolas,monospace';c.fillStyle='#6b8ca2';
      if(!this.frame){c.fillText('Waiting for valid calculated cells. No sample texture is generated.',22,49);this.plot=null;return;}
      c.fillText((this.mode==='material'?'SEPARATE IRON REFERENCE LAB':'LOCAL PERIODIC PLASMA BOX')+' · FRAME '+this.frame.sequence,22,44);
      const left=w<360?40:49,right=w<360?54:85,top=68,bottom=55,size=Math.max(1,Math.min(w-left-right,h-top-bottom)),p={x:left+Math.max(0,(w-left-right-size)/2),y:top,size};this.plot=p;c.imageSmoothingEnabled=false;c.drawImage(this.tile,p.x,p.y,p.size,p.size);
      c.strokeStyle='#466171';c.lineWidth=1;c.strokeRect(p.x,p.y,p.size,p.size);c.font='9px Consolas,monospace';c.fillStyle='#84a2b5';
      const materialMode=this.mode==='material',axisLength=materialMode?this.frame.parameters.ironLengthM:this.frame.grid.length,axisUnits=materialMode?'m · iron lab':'L₀';
      for(let i=0;i<=4;i++){const t=i/4,value=fmt(axisLength*t),x=p.x+t*p.size,y=p.y+(1-t)*p.size;c.textAlign='center';c.fillText(value,x,p.y+p.size+17);c.textAlign='right';c.fillText(value,p.x-9,y+3);c.strokeStyle='#426072';c.beginPath();c.moveTo(x,p.y+p.size);c.lineTo(x,p.y+p.size+4);c.moveTo(p.x-4,y);c.lineTo(p.x,y);c.stroke();}
      c.textAlign='center';c.fillStyle='#7898ae';c.fillText('x / '+axisUnits+' · periodic',p.x+p.size*.5,p.y+p.size+36);c.save();c.translate(12,p.y+p.size*.5);c.rotate(-Math.PI/2);c.fillText('y / '+axisUnits+' · periodic',0,0);c.restore();
      c.save();c.beginPath();c.rect(p.x,p.y,p.size,p.size);c.clip();if(this.mode!=='material'){if(this.overlays.magnetic)this.drawVectors(c,p,'magnetic');if(this.overlays.velocity)this.drawVectors(c,p,'velocity');if(this.overlays.defects)this.drawDefects(c,p);}
      if(this.selection){const {nx,ny}=this.frame.grid,x=p.x+this.selection.ix/nx*p.size,y=p.y+(1-(this.selection.iy+1)/ny)*p.size;c.strokeStyle='#fff3ce';c.lineWidth=1.5;c.strokeRect(x,y,p.size/nx,p.size/ny);}c.restore();this.drawLegend(c,p,w);
      if(this.error){c.fillStyle='rgba(67,24,35,.94)';c.fillRect(0,0,w,54);c.fillStyle='#f9c5c1';c.font='10px Consolas,monospace';c.textAlign='left';c.fillText('INVALID FRAME REJECTED · showing last accepted sequence '+this.frame.sequence,15,23);c.fillText(this.error.slice(0,Math.max(20,Math.floor((w-30)/6))),15,41);}
    }
    destroy() {if(this.destroyed)return;this.destroyed=true;this.resizeObserver?.disconnect();for(const [target,name,handler,options]of this.listeners)target.removeEventListener?.(name,handler,options);this.listeners=[];this.frame=null;this.texture=null;this.tile=null;}
    static validateSnapshot(snapshot) {return validateSnapshot(snapshot);}
    static createTexture(snapshot,mode='phase') {return makeTexture(validateSnapshot(snapshot),modeName(mode));}
  }
  PhaseTextureView.MODES=MODES;
  root.PhaseTextureView=PhaseTextureView;
  if(typeof module==='object'&&module.exports)module.exports=PhaseTextureView;
})(globalThis);
