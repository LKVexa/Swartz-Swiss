/* Native WebGL presentation. Numerical trajectories come from the backend.
 * Kerr surfaces are Boyer-Lindquist coordinate embeddings, not optical images.
 * The disk, stars, emission and the hypothesis mouths are illustrations. */
(function (root) {
  'use strict';
  const TAU = 2 * Math.PI, PHYSICAL_SCALE = 0.2;
  const identity = () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  function multiply(a,b) { const c=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[j*4+i]+=a[k*4+i]*b[j*4+k];return c; }
  function perspective(fov,aspect,near,far) { const f=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=f/aspect;o[5]=f;o[10]=(far+near)/(near-far);o[11]=-1;o[14]=2*far*near/(near-far);return o; }
  function normalize(v) {const n=Math.hypot(...v);return n>1e-14?v.map(x=>x/n):[0,1,0];}
  function cross(a,b) {return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function lookAt(eye,target) {
    const z=normalize(eye.map((x,i)=>x-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x),o=identity();
    o[0]=x[0];o[1]=y[0];o[2]=z[0];o[4]=x[1];o[5]=y[1];o[6]=z[1];o[8]=x[2];o[9]=y[2];o[10]=z[2];
    o[12]=-x.reduce((s,v,i)=>s+v*eye[i],0);o[13]=-y.reduce((s,v,i)=>s+v*eye[i],0);o[14]=-z.reduce((s,v,i)=>s+v*eye[i],0);return o;
  }
  function model(angle=0,scale=1,x=0,y=0,z=0) {const o=identity(),c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;o[0]=c;o[2]=-s;o[5]=scale;o[8]=s;o[10]=c;o[12]=x;o[13]=y;o[14]=z;return o;}
  function geometry(positions,normals) {return {positions:new Float32Array(positions),normals:new Float32Array(normals||positions.map(()=>0)),count:positions.length/3};}
  function ring(radius,y=0,n=128) {const p=[];for(let i=0;i<n;i++){const a=TAU*i/n,b=TAU*(i+1)/n;p.push(radius*Math.cos(a),y,radius*Math.sin(a),radius*Math.cos(b),y,radius*Math.sin(b));}return geometry(p);}
  function sphere() {
    const p=[],n=[],s=20,t=12;
    function v(i,j){const phi=TAU*i/s,theta=Math.PI*j/t;return [Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];}
    for(let j=0;j<t;j++)for(let i=0;i<s;i++){const a=v(i,j),b=v(i+1,j),c=v(i,j+1),d=v(i+1,j+1);[a,b,c,b,d,c].forEach(q=>{p.push(...q);n.push(...q);});}return geometry(p,n);
  }
  function cap(radius) {const p=[],n=[];for(let i=0;i<96;i++){const a=TAU*i/96,b=TAU*(i+1)/96;[[0,.04,0],[radius*Math.cos(b),.04,radius*Math.sin(b)],[radius*Math.cos(a),.04,radius*Math.sin(a)]].forEach(v=>{p.push(...v);n.push(0,1,0);});}return geometry(p,n);}
  function throat(radius) {
    const cols=64,rows=32,p=[],n=[],wire=[],inner=Math.max(.015,radius*1.3);
    function at(i,j) {const y=-1.95+3.9*j/rows,t=TAU*i/cols,r=Math.sqrt(inner*inner+1.62*y*y),dr=1.62*y/r;return {p:[r*Math.cos(t),y,r*Math.sin(t)],n:normalize([Math.cos(t),-dr,Math.sin(t)])};}
    const add=v=>{p.push(...v.p);n.push(...v.n);};
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=at(i,j),b=at(i+1,j),c=at(i,j+1),d=at(i+1,j+1);[a,c,b,b,c,d].forEach(add);if(j%3===0)wire.push(...a.p,...b.p);if(i%4===0)wire.push(...a.p,...c.p);}
    return {mesh:geometry(p,n),wire:geometry(wire),inner};
  }
  function annulus(inner,outer,y=0) {
    const p=[],n=[],s=128;
    for(let i=0;i<s;i++){const a=TAU*i/s,b=TAU*(i+1)/s;const v=[[inner*Math.cos(a),y,inner*Math.sin(a)],[outer*Math.cos(a),y,outer*Math.sin(a)],[inner*Math.cos(b),y,inner*Math.sin(b)],[outer*Math.cos(b),y,outer*Math.sin(b)]];[v[0],v[2],v[1],v[1],v[2],v[3]].forEach(q=>{p.push(...q);n.push(0,1,0);});}return geometry(p,n);
  }
  function particleDisk(inner,outer,count=1500) {
    const p=[];for(let i=0;i<count;i++){const u=(i*73%count)/count,r=Math.sqrt(inner*inner+(outer*outer-inner*inner)*u),a=i*2.39996323;p.push(r*Math.cos(a),Math.sin(i*1.73)*.055,r*Math.sin(a));}return geometry(p);
  }
  function spiralDisk(inner,outer) {
    const p=[];for(let arm=0;arm<5;arm++)for(let i=0;i<110;i++){const t=i/110,u=(i+1)/110,r=inner+(outer-inner)*t,s=inner+(outer-inner)*u,a=arm*TAU/5+t*7,b=arm*TAU/5+u*7;p.push(r*Math.cos(a),.018,r*Math.sin(a),s*Math.cos(b),.018,s*Math.sin(b));}return geometry(p);
  }
  function stars() {
    const layers=[[],[],[]];for(let i=0;i<920;i++){const y=1-2*(i+.5)/920,a=i*2.39996323,r=23+(i%7)*1.9,s=Math.sqrt(1-y*y);layers[i%3].push(r*s*Math.cos(a),r*y,r*s*Math.sin(a));}return layers.map(p=>geometry(p));
  }
  // All coordinates here are divided by M. No Euclidean length is presented as
  // a proper distance. The y axis is the spin axis in the backend convention.
  function kerrReference(p) {
    if(!p||!finite(p.M)||p.M<=0||!finite(p.a)||!finite(p.Q)||!finite(p.rPlus))return null;
    const a=p.a/p.M,q=p.Q/p.M,d=1-a*a-q*q;
    if(!finite(a)||!finite(q)||d<0)return null;
    const rPlus=1+Math.sqrt(d);
    if(Math.abs(p.rPlus/p.M-rPlus)>1e-8)return null;
    function embedded(theta,phi,r) {const rho=Math.sqrt(r*r+a*a)*Math.sin(theta);return [rho*Math.cos(phi),r*Math.cos(theta),rho*Math.sin(phi)];}
    function surface(kind) {
      const p=[],n=[],wire=[],s=80,t=40;
      function v(i,j) {
        const theta=Math.PI*j/t,phi=TAU*i/s;
        const radius=u=>kind==='horizon'?rPlus:1+Math.sqrt(1-q*q-a*a*Math.cos(u)**2);
        const r=radius(theta),point=embedded(theta,phi,r),h=1e-5;
        let normal;
        if(j===0||j===t)normal=[0,j===0?1:-1,0];
        else {const lo=embedded(theta-h,phi,radius(theta-h)),hi=embedded(theta+h,phi,radius(theta+h)),dt=hi.map((x,k)=>x-lo[k]),df=[-point[2],0,point[0]];normal=normalize(cross(df,dt));}
        return {p:point,n:normal};
      }
      const add=v=>{p.push(...v.p);n.push(...v.n);};
      for(let j=0;j<t;j++)for(let i=0;i<s;i++){const a=v(i,j),b=v(i+1,j),c=v(i,j+1),d=v(i+1,j+1);[a,b,c,b,d,c].forEach(add);if(j%5===0)wire.push(...a.p,...b.p);if(i%10===0)wire.push(...a.p,...c.p);}
      return {mesh:geometry(p,n),wire:geometry(wire)};
    }
    const equatorialHorizon=Math.sqrt(rPlus*rPlus+a*a),rErgo=1+Math.sqrt(1-q*q);
    return {horizon:surface('horizon'),ergosphere:surface('ergosphere'),horizonRing:ring(equatorialHorizon),ergosphereRing:ring(Math.sqrt(rErgo*rErgo+a*a)),rPlus,rErgo,a,q,equatorialHorizon};
  }
  function trajectories(physics) {
    const result={rays:[],invalid:0,points:0};
    if(physics?.status!=='ready')return result;
    const supplied=physics.rays?.trajectories;
    if(!Array.isArray(supplied)||supplied.length>256)return {...result,invalid:1};
    for(const ray of supplied) {
      if(!ray||!Array.isArray(ray.points)||ray.points.length<2||ray.points.length>4096||!ray.points.every(p=>Array.isArray(p)&&p.length===3&&p.every(x=>finite(x)&&Math.abs(x)<=1e6))){result.invalid++;continue;}
      const line=[];for(let i=0;i<ray.points.length-1;i++)line.push(...ray.points[i],...ray.points[i+1]);
      const outcome=ray.outcome,color=Array.isArray(ray.color)&&ray.color.length===3&&ray.color.every(x=>finite(x)&&x>=0&&x<=1)?ray.color.slice():outcome==='captured'?[1,.47,.22]:outcome==='escaped'?[.26,.85,1]:[.72,.61,.98];
      result.rays.push({line:geometry(line),start:geometry(ray.points[0]),end:geometry(ray.points[ray.points.length-1]),color,outcome});result.points+=ray.points.length;
    }
    return result;
  }
  class ApertureRenderer {
    constructor(canvas) {
      this.canvas=canvas;this.state=null;this.mode='hypothesis';this.yaw=.69;this.pitch=.36;this.distance=10.8;this.radius=-1;this.lastSequence=-1;this.contextLost=false;this.destroyed=false;this.buffers=new Map();this.rayData={rays:[],invalid:0,points:0};this.physicalKey='';this.rayKey=null;this.listeners=[];this.animation=null;
      const gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});
      if(!gl)throw new Error('This view requires WebGL. The calculated data and controls remain available.');this.gl=gl;
      this.initialize();this.sphere=sphere();this.starLayers=stars();this.orbitRings=[1,2,3,4,5].map(r=>ring(r));this.axis=geometry([0,-5,0,0,5,0]);
      this.dust=particleDisk(2.25,4.1);this.spiral=spiralDisk(2.25,4.1);this.diskBands=Array.from({length:8},(_,i)=>annulus(2.25+i*.23,2.25+(i+1)*.23));
      this.physicalDust=particleDisk(2.65,8,1800);this.physicalSpiral=spiralDisk(2.65,8);this.physicalDisk=Array.from({length:10},(_,i)=>annulus(2.65+i*.535,2.65+(i+1)*.535));
      this.makeLegend();
      let drag=null;
      this.on(canvas,'pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});
      this.on(canvas,'pointermove',e=>{if(!drag)return;this.yaw+=(e.clientX-drag.x)*.007;this.pitch=clamp(this.pitch+(e.clientY-drag.y)*.005,-1.25,1.25);drag={x:e.clientX,y:e.clientY};this.requestRender();});
      this.on(canvas,'pointerup',()=>{drag=null;});this.on(canvas,'pointercancel',()=>{drag=null;});this.on(canvas,'lostpointercapture',()=>{drag=null;});
      this.on(canvas,'wheel',e=>{e.preventDefault();this.distance=clamp(this.distance*Math.exp(clamp(e.deltaY,-300,300)*.001),3.2,40);this.requestRender();},{passive:false});
      this.on(canvas,'keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')this.yaw-=.08;if(e.key==='ArrowRight')this.yaw+=.08;if(e.key==='ArrowUp')this.pitch=clamp(this.pitch+.06,-1.25,1.25);if(e.key==='ArrowDown')this.pitch=clamp(this.pitch-.06,-1.25,1.25);if(e.key==='+'||e.key==='=')this.distance=clamp(this.distance-.4,3.2,40);if(e.key==='-')this.distance=clamp(this.distance+.4,3.2,40);if(e.key==='Home')this.reset();this.requestRender();}});
      this.on(canvas,'webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.updateLegend();});
      this.on(canvas,'webglcontextrestored',()=>{this.contextLost=false;this.buffers.clear();try{this.initialize();}catch(error){this.contextLost=true;this.contextError=error.message;}this.updateLegend();this.requestRender();});
      if(typeof root.ResizeObserver==='function'){this.resizeObserver=new root.ResizeObserver(()=>this.requestRender());this.resizeObserver.observe(canvas);}
      this.requestRender();
    }
    on(target,name,listener,options) {target.addEventListener(name,listener,options);this.listeners.push([target,name,listener,options]);}
    requestRender() {if(this.destroyed||this.contextLost||this.animation!==null)return;if(typeof root.requestAnimationFrame==='function')this.animation=root.requestAnimationFrame(()=>{this.animation=null;this.render();});else this.render();}
    initialize() {
      const gl=this.gl;
      const vs=`attribute vec3 aPosition; attribute vec3 aNormal;
        uniform mat4 uVP,uModel; uniform float uPointSize,uPhase,uOrbit;
        varying mediump vec3 normal,world;
        void main(){vec3 pos=aPosition;vec3 norm=aNormal;
          if(uOrbit>0.5){float r=max(length(pos.xz),0.1);float a=uPhase*0.6/pow(r,1.15);mat2 turn=mat2(cos(a),-sin(a),sin(a),cos(a));pos.xz=turn*pos.xz;norm.xz=turn*norm.xz;}
          vec4 p=uModel*vec4(pos,1.0);world=p.xyz;normal=mat3(uModel)*norm;gl_Position=uVP*p;
          gl_PointSize=uPointSize;}`;
      const precision=gl.getShaderPrecisionFormat?.(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision>0?'highp':'mediump';
      const fs=`precision ${precision} float; varying mediump vec3 normal,world;
        uniform vec3 uColor,uEye; uniform float uOpacity,uLit,uPoint,uEmission,uRim;
        void main(){float alpha=uOpacity;vec3 color=uColor;
          if(uPoint>0.5){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;alpha*=1.0-smoothstep(0.04,0.5,d);color*=1.0+0.65*(1.0-smoothstep(0.0,0.28,d));}
          if(uLit>0.5){vec3 n=normalize(normal);vec3 eye=normalize(uEye-world);if(dot(n,eye)<0.0)n=-n;vec3 light=normalize(vec3(-0.5,0.9,0.8));float diffuse=max(dot(n,light),0.0);float spec=pow(max(dot(reflect(-light,n),eye),0.0),28.0);float rim=pow(1.0-max(dot(n,eye),0.0),2.5);color*=0.24+0.76*diffuse;color+=vec3(0.5,0.7,0.9)*spec*0.18;color+=uColor*rim*uRim;}
          color+=uColor*uEmission;float fog=1.0-exp(-0.018*length(world-uEye));color=mix(color,vec3(0.015,0.025,0.04),min(fog,0.55));gl_FragColor=vec4(color,alpha);}`;
      function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('3D shader: '+gl.getShaderInfoLog(s));return s;}
      const vertex=shader(gl.VERTEX_SHADER,vs),fragment=shader(gl.FRAGMENT_SHADER,fs),program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('3D program: '+gl.getProgramInfoLog(program));
      gl.deleteShader(vertex);gl.deleteShader(fragment);this.program=program;gl.useProgram(program);this.locations={};
      ['uVP','uModel','uColor','uEye','uOpacity','uLit','uPoint','uPointSize','uPhase','uOrbit','uEmission','uRim'].forEach(k=>this.locations[k]=gl.getUniformLocation(program,k));this.position=gl.getAttribLocation(program,'aPosition');this.normal=gl.getAttribLocation(program,'aNormal');
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.008,.015,.026,1);
    }
    makeLegend() {
      const document=this.canvas.ownerDocument||root.document,parent=this.canvas.parentElement;
      if(!document?.createElement||!parent?.appendChild)return;
      this.legend=document.createElement('div');this.legend.className='renderer-scope';this.legend.setAttribute('role','note');
      Object.assign(this.legend.style,{position:'absolute',left:'20px',right:'20px',bottom:'46px',pointerEvents:'none',font:'10px/1.6 ui-monospace, Consolas, monospace',color:'#aac3d3',padding:'7px 10px',border:'1px solid rgba(121,171,204,.17)',borderRadius:'6px',background:'rgba(5,13,23,.72)',backdropFilter:'blur(8px)',zIndex:'2'});
      parent.appendChild(this.legend);this.updateLegend();
    }
    updateLegend() {
      if(!this.legend)return;
      if(this.contextLost){this.legend.textContent='3D graphics context unavailable. Numerical data remain available; restoring the graphics context will restore the view.';return;}
      this.legend.style.top=this.mode==='hypothesis'?'104px':'auto';this.legend.style.bottom=this.mode==='hypothesis'?'auto':'46px';
      if(this.mode==='hypothesis'){this.legend.textContent='SCHEMATIC HYPOTHESIS · Toy mouths and covers; illustrative disk, particles and stars. Passage indicators do not establish physical travel.';return;}
      const status=this.state?.physics?.status||'unavailable',r=this.rayData;
      this.legend.textContent='KERR COORDINATE VIEW · '+(status==='ready'?`${r.rays.length} calculated rays · orange captured / cyan escaped / violet limit`:`Ray calculation ${status}; no trajectories displayed`)+'. Surfaces and rays share 0.2 display units per M. Disk emission and stars are illustrative; this view is not a ray-traced optical image.'+(r.invalid?' Invalid trajectory data omitted.':'');
    }
    setMode(mode) {if(mode!=='hypothesis'&&mode!=='physics')throw new Error('3D mode must be hypothesis or physics.');this.mode=mode;this.updateLegend();this.requestRender();return this.getStatus();}
    getStatus() {return {webgl:!this.contextLost&&!this.destroyed,mode:this.mode,vertices:this.throat?.mesh.count||0,physicalDisplayScale:PHYSICAL_SCALE,physicalCoordinateUnits:'M',coordinateScope:'Boyer-Lindquist oblate coordinate embedding; y is the spin axis; no proper-distance or optical-image claim',physicsStatus:this.state?.physics?.status||'unavailable',physicalReference:!!this.reference,rayCount:this.rayData.rays.length,rayPoints:this.rayData.points,invalidTrajectories:this.rayData.invalid,illustrations:['disk emission','disk particles','background stars','hypothesis mouths and cover'],contextError:this.contextError||null};}
    reset() {this.yaw=.69;this.pitch=.36;this.distance=10.8;this.requestRender();}
    release(g) {if(!g)return;const b=this.buffers.get(g);if(b){this.gl.deleteBuffer(b.position);this.gl.deleteBuffer(b.normal);this.buffers.delete(g);}}
    releaseReference() {if(!this.reference)return;for(const g of [this.reference.horizon.mesh,this.reference.horizon.wire,this.reference.ergosphere.mesh,this.reference.ergosphere.wire,this.reference.horizonRing,this.reference.ergosphereRing])this.release(g);}
    update(state) {
      this.state=state;
      const r=state?.branches?.gaseous?.apertureRadius;
      if(finite(r)&&r>=0&&r<=1e4&&r!==this.radius){for(const g of [this.throat?.mesh,this.throat?.wire,this.apertureRing,this.cap])this.release(g);this.radius=r;this.throat=throat(r);this.apertureRing=ring(this.throat.inner);this.cap=cap(this.throat.inner*1.015);}
      const p=state?.physics,key=p?[p.M,p.a,p.Q,p.rPlus].join('|'):'';
      if(key!==this.physicalKey){this.releaseReference();this.reference=kerrReference(p);this.physicalKey=key;}
      // Status belongs in the identity: a newly queued solve must not leave the
      // previous generation's ray bundle visible against changed parameters.
      const rayKey=p?[p.status,p.generation,p.M,p.a,p.Q].join('|'):'';
      // HTTP/SSE snapshots clone the same bundle. Compare its complete values
      // so clones reuse GPU buffers while changed interior samples still update.
      const raySource=p?.status==='ready'?JSON.stringify(p.rays):null;
      if(rayKey!==this.rayKey||this.raySource!==raySource){for(const ray of this.rayData.rays){this.release(ray.line);this.release(ray.start);this.release(ray.end);}this.rayData=trajectories(p);this.rayKey=rayKey;this.raySource=raySource;}
      this.lastSequence=state?.sequence;this.updateLegend();this.requestRender();
    }
    draw(g,mode,color,opacity=1,m=identity(),options={}) {
      if(!g||g.count===0)return;
      const gl=this.gl,l=this.locations;let buffers=this.buffers.get(g);
      if(!buffers){buffers={position:gl.createBuffer(),normal:gl.createBuffer()};gl.bindBuffer(gl.ARRAY_BUFFER,buffers.position);gl.bufferData(gl.ARRAY_BUFFER,g.positions,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,buffers.normal);gl.bufferData(gl.ARRAY_BUFFER,g.normals,gl.STATIC_DRAW);this.buffers.set(g,buffers);}
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers.position);gl.enableVertexAttribArray(this.position);gl.vertexAttribPointer(this.position,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers.normal);gl.enableVertexAttribArray(this.normal);gl.vertexAttribPointer(this.normal,3,gl.FLOAT,false,0,0);
      gl.uniformMatrix4fv(l.uModel,false,m);gl.uniform3fv(l.uColor,color);gl.uniform1f(l.uOpacity,opacity);gl.uniform1f(l.uLit,options.lit?1:0);gl.uniform1f(l.uPoint,options.point?1:0);gl.uniform1f(l.uPointSize,options.point||1);gl.uniform1f(l.uOrbit,options.orbit?1:0);gl.uniform1f(l.uEmission,options.emission||0);gl.uniform1f(l.uRim,options.rim||0);gl.drawArrays(mode,0,g.count);
    }
    transparentSurface(g,color,opacity,m,rim=0.4) {
      const gl=this.gl;gl.depthMask(false);gl.enable(gl.CULL_FACE);gl.cullFace(gl.FRONT);this.draw(g,gl.TRIANGLES,color,opacity,m,{lit:true,rim});gl.cullFace(gl.BACK);this.draw(g,gl.TRIANGLES,color,opacity,m,{lit:true,rim});gl.disable(gl.CULL_FACE);
    }
    background(dpr) {
      const gl=this.gl;gl.depthMask(false);this.starLayers.forEach((g,i)=>this.draw(g,gl.POINTS,[[.49,.68,.86],[.91,.75,.57],[.75,.84,1]][i],.45+i*.1,identity(),{point:(1.2+i*.55)*dpr,emission:.15}));
    }
    emission(dpr,physical,color) {
      const gl=this.gl,m=physical?model(0,PHYSICAL_SCALE):identity(),bands=physical?this.physicalDisk:this.diskBands;
      gl.depthMask(false);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
      bands.forEach((g,i)=>{const t=i/(bands.length-1),c=physical?[1,.43+.35*(1-t),.15+.55*(1-t)]:color;this.draw(g,gl.TRIANGLES,c,.035+.04*(1-t),m,{emission:.7});});
      this.draw(physical?this.physicalSpiral:this.spiral,gl.LINES,physical?[1,.69,.38]:color,.27,m,{orbit:true,emission:.55});
      this.draw(physical?this.physicalDust:this.dust,gl.POINTS,physical?[1,.72,.46]:color,.73,m,{orbit:true,point:2.2*dpr,emission:.5});gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    }
    hypothesis(branch,dpr) {
      if(!this.throat)return;
      const gl=this.gl,color=branch?[.95,.67,.35]:[.26,.83,.85],b=branch?this.state.branches.aggie:this.state.branches.gaseous,m=identity();
      // Opaque material writes depth before transparent meshes and emission.
      gl.depthMask(true);
      if(b.cover===1||!b.geometricOpen){this.draw(this.cap,gl.TRIANGLES,branch?[.26,.16,.09]:[.055,.16,.19],1,m,{lit:true,rim:.15});if(b.cover===1)for(let i=0;i<18;i++){const angle=i*2.39996323,rr=this.throat.inner*(.2+.6*(i%5)/5),size=this.throat.inner*(.13+.045*(i%3));this.draw(this.sphere,gl.TRIANGLES,[.27+(i%3)*.085,.17+(i%3)*.04,.095+(i%3)*.025],1,model(i*.71,size,rr*Math.cos(angle),.04+(i%3)*.025,rr*Math.sin(angle)),{lit:true,rim:.16});}}
      gl.depthMask(false);this.orbitRings.forEach((g,i)=>this.draw(g,gl.LINES,color,.035+i*.01));this.emission(dpr,false,color);
      this.transparentSurface(this.throat.mesh,color,.09,m,.5);this.draw(this.throat.wire,gl.LINES,color,.26);this.draw(this.apertureRing,gl.LINES,color,.95,m,{emission:.2});gl.depthMask(true);
    }
    physics(dpr) {
      const gl=this.gl,ref=this.reference,m=model(0,PHYSICAL_SCALE);
      if(ref){gl.depthMask(true);this.draw(ref.horizon.mesh,gl.TRIANGLES,[.012,.025,.041],1,m,{lit:true,rim:.7});}
      gl.depthMask(false);
      // Scale rings use M units in the same embedding scale as the ray points.
      this.orbitRings.forEach((g,i)=>this.draw(g,gl.LINES,[.25,.47,.65],.06+i*.008,m));this.draw(this.axis,gl.LINES,[.43,.63,.79],.18,m);this.emission(dpr,true,[1,.7,.42]);
      if(ref){this.transparentSurface(ref.ergosphere.mesh,[.16,.52,.82],.055,m,.5);this.draw(ref.ergosphere.wire,gl.LINES,[.23,.6,.89],.13,m);this.draw(ref.horizon.wire,gl.LINES,[.31,.61,.79],.2,m);this.draw(ref.horizonRing,gl.LINES,[.43,.8,1],.86,m,{emission:.2});this.draw(ref.ergosphereRing,gl.LINES,[.32,.54,.86],.65,m);}
      // Connect supplied samples only; never invent, animate or deflect rays.
      for(const ray of this.rayData.rays){this.draw(ray.line,gl.LINES,ray.color,.85,m,{emission:.22});this.draw(ray.start,gl.POINTS,ray.color,.7,m,{point:3*dpr});this.draw(ray.end,gl.POINTS,ray.color,.95,m,{point:4*dpr,emission:.2});}gl.depthMask(true);
    }
    render() {
      if(this.contextLost||this.destroyed)return;
      const gl=this.gl,canvas=this.canvas,dpr=clamp(root.devicePixelRatio||1,1,2),w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
      if(w<2||h<2)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.useProgram(this.program);gl.depthMask(true);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!this.state)return;
      const half=Math.floor(w/2),eye=[Math.sin(this.yaw)*Math.cos(this.pitch)*this.distance,Math.sin(this.pitch)*this.distance,Math.cos(this.yaw)*Math.cos(this.pitch)*this.distance];
      gl.uniform3fv(this.locations.uEye,eye);const phase=finite(this.state.motion?.phase)?this.state.motion.phase:0;gl.uniform1f(this.locations.uPhase,phase);
      for(let branch=0;branch<2;branch++){const width=branch?w-half:half,aspect=width/h,fov=clamp(2*Math.atan(Math.tan(Math.PI/8)/Math.min(1,aspect)),Math.PI/4,Math.PI*.6);gl.viewport(branch?half:0,0,width,h);gl.uniformMatrix4fv(this.locations.uVP,false,multiply(perspective(fov,aspect,.05,120),lookAt(eye,[0,0,0])));this.background(dpr);if(this.mode==='physics')this.physics(dpr);else this.hypothesis(branch,dpr);}
      gl.depthMask(true);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    }
    destroy() {if(this.destroyed)return;this.destroyed=true;this.resizeObserver?.disconnect();if(typeof root.cancelAnimationFrame==='function')root.cancelAnimationFrame(this.animation);this.listeners.forEach(([target,name,listener,options])=>target.removeEventListener?.(name,listener,options));for(const [g]of this.buffers)this.release(g);this.gl.deleteProgram(this.program);this.legend?.remove();}
  }
  root.ApertureRenderer=ApertureRenderer;
})(globalThis);
