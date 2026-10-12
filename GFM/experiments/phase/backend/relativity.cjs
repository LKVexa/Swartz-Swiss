'use strict';
// Neutral photons on a fixed vacuum Kerr exterior. No aperture/cover assumption
// enters these equations. Carter-separated equations: Gralla & Lupsasca,
// https://arxiv.org/html/1910.12881, equations (1)-(9), with E=1.
const REFERENCE = 'https://arxiv.org/html/1910.12881';
const METHOD = 'Adaptive Dormand-Prince RK5(4), Carter-separated Kerr null equations in Mino parameter';
function finite(value,name,min,max) { if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max) throw new RangeError(name+' must be finite in '+min+'..'+max+'.'); return value; }
function object(value) { if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw new TypeError('Expected a plain parameter object.'); for(const d of Object.values(Object.getOwnPropertyDescriptors(value))) if(!Object.hasOwn(d,'value')) throw new TypeError('Parameters must contain data properties.'); return value; }
function analyticKerr(spin=0,M=1) {
  finite(M,'M',.01,100); finite(spin,'spin',0,1);
  const a=spin*M, root=M*Math.sqrt((1-spin)*(1+spin)), rPlus=M+root, rMinus=spin===0?0:a*a/rPlus;
  const prograde=2*M*(1+Math.cos(2/3*Math.acos(-spin))),retrograde=2*M*(1+Math.cos(2/3*Math.acos(spin)));
  return {M,a,spin,rPlus,rMinus,omegaH:a/(rPlus*rPlus+a*a),schwarzschild:{horizon:2*M,photonSphere:3*M,criticalImpact:3*Math.sqrt(3)*M,weakDeflectionCoefficient:4*M},
    equatorialPhotonRadii:{prograde,retrograde},equatorialCriticalImpact:{prograde:a+prograde**1.5/Math.sqrt(M),retrograde:a-retrograde**1.5/Math.sqrt(M)},
    units:'Geometrized G=c=1; a=spin*M. Carter Q denotes a photon integral, not electric charge.',reference:REFERENCE};
}
function potentials(u,mu,p) {
  const {M,a,Lz,carterQ:Q}=p, K=(Lz-a)**2+Q;
  return { radial:1+(a*a-Lz*Lz-Q)*u*u+2*M*K*u**3-a*a*Q*u**4,
    polar:Q+(a*a-Q-Lz*Lz)*mu*mu-a*a*mu**4 };
}
function rhs(y,p) {
  const [u,v,mu,w]=y, {M,a,Lz,carterQ:Q}=p, sin2=1-mu*mu, D=1-2*M*u+a*a*u*u;
  if(!(u>0&&sin2>0&&D>0)) throw new RangeError('Trial step left the guarded Boyer-Lindquist exterior.');
  const P=1+a*(a-Lz)*u*u, radialAcceleration=(a*a-Lz*Lz-Q)*u+3*M*((Lz-a)**2+Q)*u*u-2*a*a*Q*u**3;
  return [v,radialAcceleration,w,(a*a-Q-Lz*Lz)*mu-2*a*a*mu**3,
    a*P/D+Lz/sin2-a,(1+a*a*u*u)*P/(u*u*D)+a*Lz-a*a*sin2,1/(u*u)+a*a*mu*mu];
}
const A=[[],[1/5],[3/40,9/40],[44/45,-56/15,32/9],[19372/6561,-25360/2187,64448/6561,-212/729],[9017/3168,-355/33,46732/5247,49/176,-5103/18656],[35/384,0,500/1113,125/192,-2187/6784,11/84]];
const B5=[35/384,0,500/1113,125/192,-2187/6784,11/84,0], B4=[5179/57600,0,7571/16695,393/640,-92097/339200,187/2100,1/40];
function rkStep(y,h,p) {
  const k=[];
  for(let stage=0;stage<7;stage++) { const z=y.map((value,i)=>value+h*A[stage].reduce((sum,c,j)=>sum+c*k[j][i],0)); k.push(rhs(z,p)); }
  const next=y.map((value,i)=>value+h*B5.reduce((sum,c,j)=>sum+c*k[j][i],0));
  const error=y.map((_,i)=>h*B5.reduce((sum,c,j)=>sum+(c-B4[j])*k[j][i],0));
  if(next.some(x=>!Number.isFinite(x))||error.some(x=>!Number.isFinite(x))) throw new RangeError('Nonfinite numerical trial step.');
  return {next,error};
}
function errorNorm(y,step,p) {
  const base=[1/p.M,1,1,p.M,1,p.M,p.M];
  return Math.max(...step.error.map((value,i)=>Math.abs(value)/(p.internalTolerance*(base[i]+Math.max(Math.abs(y[i]),Math.abs(step.next[i]))))));
}
function reconstruct(y,p) {
  const [u,v,mu,w]=y, r=1/u, sin2=1-mu*mu, sigma=r*r+p.a*p.a*mu*mu, delta=r*r-2*p.M*r+p.a*p.a;
  const velocity=rhs(y,p), dt=velocity[5]/sigma, dphi=velocity[4]/sigma, dr=-v/(u*u*sigma), dtheta=-w/(Math.sqrt(sin2)*sigma);
  const gtt=-(1-2*p.M*r/sigma), gtp=-2*p.M*p.a*r*sin2/sigma, gpp=(r*r+p.a*p.a+2*p.M*p.a*p.a*r*sin2/sigma)*sin2;
  const E=-(gtt*dt+gtp*dphi), Lz=gtp*dt+gpp*dphi, ptheta=sigma*dtheta;
  const Q=ptheta*ptheta-mu*mu*(p.a*p.a*E*E-Lz*Lz/sin2);
  const nullTerms=[gtt*dt*dt,2*gtp*dt*dphi,gpp*dphi*dphi,sigma/delta*dr*dr,sigma*dtheta*dtheta];
  const nullResidual=nullTerms.reduce((sum,x)=>sum+x,0), nullNormalizedResidual=Math.abs(nullResidual)/Math.max(1,...nullTerms.map(Math.abs));
  return {E,Lz,carterQ:Q,nullResidual,nullNormalizedResidual};
}
function makePoint(y,mino,p) {
  const [u,v,mu,w,phi,t,affine]=y, r=1/u, sin=Math.sqrt(Math.max(0,1-mu*mu)), radial=Math.sqrt(r*r+p.a*p.a)*sin, potential=potentials(u,mu,p), reconstruction=reconstruct(y,p);
  return {x:radial*Math.cos(phi),y:r*mu,z:radial*Math.sin(phi),r,theta:Math.acos(mu),phi,t,affine,mino,u,duDmino:v,mu,dmuDmino:w,
    radialConstraintResidual:v*v-potential.radial,polarConstraintResidual:w*w-potential.polar,reconstruction};
}
function stationaryRadial(p) {
  const A=-2*p.a*p.a*p.carterQ, B=3*p.M*((p.Lz-p.a)**2+p.carterQ), C=p.a*p.a-p.Lz*p.Lz-p.carterQ, roots=[];
  if(Math.abs(A)<1e-30) { if(B!==0) roots.push(-C/B); }
  else { const discriminant=B*B-4*A*C; if(discriminant>=0) { const q=-.5*(B+(B>=0?1:-1)*Math.sqrt(discriminant)); if(q!==0) roots.push(q/A,C/q); else roots.push(-B/(2*A)); } }
  return roots.filter(u=>u>0&&Number.isFinite(u)).sort((a,b)=>a-b);
}
function minimumRadial(umin,umax,p) {
  return Math.min(...[umin,umax,...stationaryRadial(p)].filter(u=>u>=umin&&u<=umax).map(u=>potentials(u,0,p).radial));
}
function criticalityAssessment(umin,umax,p,direction) {
  const normalizedBand=Math.max(64*Number.EPSILON,100*p.internalTolerance), K=(p.Lz-p.a)**2+p.carterQ;
  const rangeRoundoff=128*Number.EPSILON*Math.max(1/p.M,Math.abs(umin),Math.abs(umax));
  const stationaryPoints=stationaryRadial(p).filter(u=>u>=umin-rangeRoundoff&&u<=umax+rangeRoundoff).map(u=>{
    const V=potentials(u,0,p).radial, scale=Math.max(1,1+Math.abs((p.a*p.a-p.Lz*p.Lz-p.carterQ)*u*u)+Math.abs(2*p.M*K*u**3)+Math.abs(p.a*p.a*p.carterQ*u**4));
    const secondDerivative=2*(p.a*p.a-p.Lz*p.Lz-p.carterQ)+12*p.M*K*u-12*p.a*p.a*p.carterQ*u*u;
    const absoluteBand=normalizedBand*scale, guardDistance=Math.sqrt(2*absoluteBand/Math.max(Math.abs(secondDerivative),1e-20*p.M*p.M));
    return {u,r:1/u,potential:V,potentialScale:scale,normalizedPotential:V/scale,absoluteBand,secondDerivative,guardDistance,nearCritical:Math.abs(V)<=absoluteBand};
  });
  const candidates=stationaryPoints.filter(point=>point.nearCritical); if(direction==='outward') candidates.reverse();
  const selected=candidates[0]??null;
  return {isNearCritical:!!selected,normalizedBand,rangeRoundoff,stationaryPoints,selected,examinedURange:[umin,umax],
    criterion:'At accessible stationary points Vprime=0: abs(V)/max(1,sum(abs(potential terms))) <= max(64*machine_epsilon,100*internalTolerance). Stop before a double-root uncertainty neighborhood sqrt(2*absoluteBand/abs(Vsecond)).',
    scope:'Conservative numerical classification band near an unstable radial separatrix, not a physical thickness or an additional force law.'};
}
function boundaryState(previous,h,p,coordinate,boundary) {
  let low=0,high=h;
  const startSign=Math.sign(previous[coordinate]-boundary);
  for(let i=0;i<45;i++) { const mid=(low+high)/2, state=rkStep(previous,mid,p).next; if(Math.sign(state[coordinate]-boundary)===startSign) low=mid; else high=mid; }
  const dt=(low+high)/2; return {state:rkStep(previous,dt,p).next,dt};
}
function integrateScalar(fn,start,end,tolerance=1e-12) {
  const mid=(start+end)/2,fa=fn(start),fm=fn(mid),fb=fn(end),S=(end-start)*(fa+4*fm+fb)/6;
  function recurse(a,b,x,y,z,whole,tol,depth) { const m=(a+b)/2,l=(a+m)/2,r=(m+b)/2,fl=fn(l),fr=fn(r),left=(m-a)*(x+4*fl+y)/6,right=(b-m)*(y+4*fr+z)/6,delta=left+right-whole;
    if(depth===0||Math.abs(delta)<=15*tol) return left+right+delta/15;
    return recurse(a,m,x,fl,y,left,tol/2,depth-1)+recurse(m,b,y,fr,z,right,tol/2,depth-1); }
  return recurse(start,end,fa,fm,fb,S,tolerance,22);
}
function integrateRay(input={}) {
  object(input);
  const allowed=['spin','M','Lz','carterQ','observerRadius','escapeRadius','inclination','phi0','tolerance','maxStep','maxMino','maxSteps','maxPoints','horizonGuard','polarSign','radialDirection','id'];
  if(Object.keys(input).some(key=>!allowed.includes(key))) throw new RangeError('Unknown ray parameter.');
  const M=finite(input.M??1,'M',.01,100), spin=finite(input.spin??0,'spin',0,1), metric=analyticKerr(spin,M), tolerance=finite(input.tolerance??1e-8,'tolerance',1e-11,1e-4);
  const p={M,a:metric.a,Lz:finite(input.Lz??4*M,'Lz',-1000*M,1000*M),carterQ:finite(input.carterQ??0,'carterQ',-1e6*M*M,1e6*M*M),internalTolerance:Math.min(tolerance*.02,2e-9)};
  const guard=finite(input.horizonGuard??.02*M,'horizonGuard',1e-4*M,.2*M), observerRadius=finite(input.observerRadius??20*M,'observerRadius',metric.rPlus+guard*2,1e6*M), escapeRadius=finite(input.escapeRadius??observerRadius,'escapeRadius',observerRadius,1e6*M);
  const inclination=finite(input.inclination??Math.PI/2,'inclination',.001,Math.PI-.001), phi0=finite(input.phi0??0,'phi0',-1e6,1e6), polarSign=input.polarSign??1, direction=input.radialDirection??'inward';
  if(![-1,1].includes(polarSign)||!['inward','outward'].includes(direction)) throw new RangeError('Use polarSign +/-1 and radialDirection inward/outward.');
  const maxStep=finite(input.maxStep??.025/M,'maxStep',1e-6/M,1/M), maxMino=finite(input.maxMino??10/M,'maxMino',1e-5/M,100/M), maxSteps=input.maxSteps??12000, maxPoints=input.maxPoints??600;
  if(!Number.isInteger(maxSteps)||maxSteps<10||maxSteps>50000||!Number.isInteger(maxPoints)||maxPoints<4||maxPoints>5000) throw new RangeError('Use integer maxSteps 10..50000 and maxPoints 4..5000.');
  const u0=1/observerRadius, uEscape=1/escapeRadius, uCapture=1/(metric.rPlus+guard), uHorizon=1/metric.rPlus, mu0=Math.abs(Math.cos(inclination))<1e-14?0:Math.cos(inclination), initial=potentials(u0,mu0,p), allowance=1e-12*Math.max(1,p.Lz*p.Lz,Math.abs(p.carterQ));
  if(Math.abs(mu0)>=1-1e-6) throw new RangeError('Initial position lies within the polar coordinate guard.');
  if(initial.radial < -allowance||initial.polar < -allowance) throw new RangeError('Initial position is forbidden by the radial or polar photon potential.');
  let y=[u0,(direction==='inward'?1:-1)*Math.sqrt(Math.max(0,initial.radial)),mu0,polarSign*Math.sqrt(Math.max(0,initial.polar)),phi0,0,0], mino=0,h=Math.min(maxStep,.01/M), outcome='integration-limit', acceptedSteps=0,rejectedSteps=0,evaluations=0,radialTurns=0,polarTurns=0,minimumRadius=observerRadius;
  if(!(rhs(y,p)[5]>0)) throw new RangeError('Initial photon must be future-directed (p^t > 0).');
  const samples=[makePoint(y,0,p)], maxima={maxNullResidual:0,maxNormalizedNullResidual:0,maxRadialResidual:0,maxPolarResidual:0,maxEnergyReconstructionError:0,maxLzReconstructionError:0,maxCarterReconstructionError:0}, polarGuard=1e-6;
  const criticality=criticalityAssessment(direction==='inward'?u0:uEscape,direction==='inward'?uHorizon:u0,p,direction);
  const criticalBoundary=criticality.selected?criticality.selected.u+(direction==='inward'?-1:1)*criticality.selected.guardDistance:null;
  function inspect(point) { const {reconstruction:c}=point, V=potentials(point.u,point.mu,p);
    maxima.maxNullResidual=Math.max(maxima.maxNullResidual,Math.abs(c.nullResidual)); maxima.maxNormalizedNullResidual=Math.max(maxima.maxNormalizedNullResidual,c.nullNormalizedResidual);
    maxima.maxRadialResidual=Math.max(maxima.maxRadialResidual,Math.abs(point.radialConstraintResidual)/Math.max(1,Math.abs(V.radial),point.duDmino**2));
    maxima.maxPolarResidual=Math.max(maxima.maxPolarResidual,Math.abs(point.polarConstraintResidual)/Math.max(1,Math.abs(V.polar),point.dmuDmino**2));
    maxima.maxEnergyReconstructionError=Math.max(maxima.maxEnergyReconstructionError,Math.abs(c.E-1)); maxima.maxLzReconstructionError=Math.max(maxima.maxLzReconstructionError,Math.abs(c.Lz-p.Lz)/Math.max(1,Math.abs(p.Lz)));
    maxima.maxCarterReconstructionError=Math.max(maxima.maxCarterReconstructionError,Math.abs(c.carterQ-p.carterQ)/Math.max(1,Math.abs(p.carterQ))); }
  inspect(samples[0]);
  for(let attempt=0;attempt<maxSteps&&mino<maxMino;attempt++) {
    if(criticalBoundary!==null&&(direction==='inward'?y[0]>=criticalBoundary:y[0]<=criticalBoundary)) { outcome='critical-limit'; break; }
    h=Math.min(h,maxStep,maxMino-mino);
    // Keep every RK stage clear of the coordinate horizon and infinity.
    if(y[1]>0) h=Math.min(h,.45*(uHorizon-y[0])/y[1]); else if(y[1]<0) h=Math.min(h,.45*y[0]/(-y[1]));
    if(Math.abs(y[3])>0) h=Math.min(h,.35*(1-Math.abs(y[2]))/Math.abs(y[3]));
    if(!(h>1e-13/M)) { outcome='step-limit'; break; }
    let step,error;
    try { step=rkStep(y,h,p); evaluations+=7; error=errorNorm(y,step,p); }
    catch { rejectedSteps++;h*=.3;continue; }
    if(error>1) { rejectedSteps++; h*=Math.max(.1,.9*error**(-.2)); continue; }
    const previous=y, oldMino=mino;
    y=step.next; mino+=h; acceptedSteps++;
    let boundary=null;
    if(criticalBoundary!==null&&(direction==='inward'?y[0]>=criticalBoundary:y[0]<=criticalBoundary)) boundary={coordinate:0,value:criticalBoundary,outcome:'critical-limit'};
    else if(y[0]>=uCapture&&y[1]>0) boundary={coordinate:0,value:uCapture,outcome:'horizon-limit'};
    else if(y[0]<=uEscape&&y[1]<0&&mino>1e-9/M) boundary={coordinate:0,value:uEscape,outcome:'escaped'};
    else if(Math.abs(y[2])>=1-polarGuard) boundary={coordinate:2,value:(y[2]>=0?1:-1)*(1-polarGuard),outcome:'polar-axis-limit'};
    if(boundary) { const event=boundaryState(previous,h,p,boundary.coordinate,boundary.value); evaluations+=46*7; y=event.state;mino=oldMino+event.dt; outcome=boundary.outcome; }
    if(previous[1]>0&&y[1]<0) radialTurns++; if(previous[3]*y[3]<0) polarTurns++;
    const point=makePoint(y,mino,p);samples.push(point);inspect(point);minimumRadius=Math.min(minimumRadius,point.r);
    if(boundary) {
      if(outcome==='horizon-limit') { const futureHorizonMomentum=metric.rPlus**2+p.a*p.a-p.a*p.Lz; if(futureHorizonMomentum>1e-10*M*M&&minimumRadial(y[0],uHorizon,p)>1e-12) outcome='captured'; }
      break;
    }
    h*=error===0?3:Math.min(3,Math.max(.2,.9*error**(-.2)));
  }
  if(criticality.isNearCritical&&['captured','escaped','horizon-limit','integration-limit','step-limit'].includes(outcome)) outcome='critical-limit';
  const criterion=Math.max(2e-8,tolerance*100), diagnostics={method:METHOD,tolerance,internalTolerance:p.internalTolerance,acceptedSteps,rejectedSteps,totalSteps:acceptedSteps+rejectedSteps,evaluations,minimumRadius,radialTurns,polarTurns,horizonGuard:guard,
    ...maxima,criticality,criterion,passed:maxima.maxNormalizedNullResidual<=criterion&&maxima.maxRadialResidual<=criterion&&maxima.maxPolarResidual<=criterion&&maxima.maxCarterReconstructionError<=criterion&&maxima.maxEnergyReconstructionError<=criterion&&maxima.maxLzReconstructionError<=criterion,
    invariantPolicy:'E=1 and Lz are fixed Killing integrals. Numerical evolution is checked by radial/polar first integrals and Carter reconstruction; E/Lz reconstruction is a metric consistency check, not independent integration of those fixed inputs.'};
  let deflectionRadians=null;
  if(outcome==='escaped'&&direction==='inward'&&radialTurns>0&&Math.abs(mu0)<1e-14&&p.carterQ===0&&p.Lz!==0) {
    const fn=u=>{const D=1-2*M*u+p.a*p.a*u*u,P=1+p.a*(p.a-p.Lz)*u*u;return (p.a*P/D+p.Lz-p.a)/Math.sqrt(potentials(u,0,p).radial);};
    const tail=integrateScalar(fn,0,u0)+integrateScalar(fn,0,y[0]);
    deflectionRadians=Math.sign(p.Lz)*(y[4]-phi0+tail)-Math.PI;
  }
  const stride=Math.max(1,Math.ceil((samples.length-1)/(maxPoints-1))),points=samples.filter((_,i)=>i%stride===0||i===samples.length-1);
  return {schema:'GFM-Kerr-null-ray/1',id:String(input.id??'ray'),outcome,points,constants:{E:1,Lz:p.Lz,carterQ:p.carterQ},parameters:{spin,M,observerRadius,escapeRadius,inclination,phi0,tolerance,horizonGuard:guard,polarSign,radialDirection:direction,maxStep,maxMino,maxSteps,maxPoints},diagnostics,deflectionRadians,
    coordinateConvention:'Boyer-Lindquist t,r,theta,phi; Mino dσ/dγ=Σ with E=1. Oblate coordinate embedding x=sqrt(r²+a²)sinθcosφ,y=r cosθ,z=sqrt(r²+a²)sinθsinφ; not measured proper distances.',
    deflectionConvention:'Complete equatorial incoming-to-outgoing scattering rays only, with a radial turn: signed azimuth change plus independent initial/final radial tails to infinity, minus π. Null for outward-only, non-equatorial or incomplete rays.',
    captureConvention:'Integration ends outside r+ at the guard. Captured requires inward momentum, positive future-horizon P and positive radial potential through the remaining exterior. Near a radial separatrix, critical-limit censors the numerically ambiguous neighborhood and is unresolved; horizon-limit is also unresolved.',
    scope:'Fixed neutral vacuum Kerr exterior photon trajectories. No optical emission/radiative transfer, local observer tetrad, plasma, evolving metric, traversable wormhole or aggie-cover interaction.',reference:REFERENCE};
}
function computeBundle(input={}) {
  object(input);const allowed=['spin','observerRadius','inclination','rayCount','tolerance'];if(Object.keys(input).some(key=>!allowed.includes(key)))throw new RangeError('Unknown bundle parameter.');
  const spin=finite(input.spin??.99,'spin',0,1),observerRadius=finite(input.observerRadius??20,'observerRadius',4,1000),inclination=finite(input.inclination??Math.PI/3,'inclination',.05,Math.PI-.05),tolerance=finite(input.tolerance??1e-7,'tolerance',1e-11,1e-4),rayCount=input.rayCount??16;
  if(!Number.isInteger(rayCount)||rayCount<4||rayCount>64)throw new RangeError('rayCount must be an integer in 4..64.');
  const trajectories=[];
  for(let i=0;i<rayCount;i++) {
    const alpha=(-9+18*i/(rayCount-1))*Math.min(1,observerRadius/20),beta=2.5*Math.sin(i*2.399963229728653),Lz=-alpha*Math.sin(inclination),Q=beta*beta+(alpha*alpha-spin*spin)*Math.cos(inclination)**2;
    const ray=integrateRay({spin,observerRadius,inclination,Lz,carterQ:Q,polarSign:beta<0?1:-1,tolerance,id:'ray-'+i});
    ray.impactCoordinates={alpha,beta,convention:'Chosen asymptotic Kerr impact coordinates α=-Lz/sinθ_start and β²=Q+a²cos²θ_start−Lz²cot²θ_start, with β sign equal to initial p_theta. Initialization is at finite radius, not a local orthonormal camera projection.'};trajectories.push(ray);
  }
  const metric=analyticKerr(spin), diagnostics={method:METHOD,tolerance,guard:.02,captured:trajectories.filter(r=>r.outcome==='captured').length,escaped:trajectories.filter(r=>r.outcome==='escaped').length,unresolved:trajectories.filter(r=>!['captured','escaped'].includes(r.outcome)).length,nearCritical:trajectories.filter(r=>r.diagnostics.criticality.isNearCritical).length,
    maxNullResidual:Math.max(...trajectories.map(r=>r.diagnostics.maxNullResidual)),maxNormalizedNullResidual:Math.max(...trajectories.map(r=>r.diagnostics.maxNormalizedNullResidual)),maxRadialResidual:Math.max(...trajectories.map(r=>r.diagnostics.maxRadialResidual)),maxPolarResidual:Math.max(...trajectories.map(r=>r.diagnostics.maxPolarResidual)),
    acceptedSteps:trajectories.reduce((s,r)=>s+r.diagnostics.acceptedSteps,0),rejectedSteps:trajectories.reduce((s,r)=>s+r.diagnostics.rejectedSteps,0),totalSteps:trajectories.reduce((s,r)=>s+r.diagnostics.totalSteps,0),criterion:Math.max(2e-8,tolerance*100),passed:trajectories.every(r=>r.diagnostics.passed),validationStatus:'Numerical constraints checked; this status does not certify camera imaging, unresolved rays or user formation hypotheses.'};
  return {schema:'GFM-Kerr-null-bundle/1',parameters:{spin,observerRadius,inclination,rayCount,tolerance},trajectories,diagnostics,benchmarks:metric,
    observationProtocol:'Both aperture/aggie hypothesis labels receive exactly the same Kerr exterior null rays for a shared spin; no hypothetical cover rule changes this metric.',reference:REFERENCE};
}
module.exports={analyticKerr,potentials,reconstruct,integrateRay,computeBundle};
