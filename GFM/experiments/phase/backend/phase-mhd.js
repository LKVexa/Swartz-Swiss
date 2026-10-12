(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PhaseMHD = api;
}(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  // Local Cartesian, nonrelativistic MHD. No Kerr source terms or material cover
  // enter these equations. The neutral complex order parameter is phenomenology.
  const DEFAULTS = Object.freeze({ resolution: 32, length: 2 * Math.PI, density: 1, pressure: 1,
    densityContrast: .15, temperatureContrast: .1, flowSpeed: .3, magneticStrength: .4,
    guideFieldX: .15, guideFieldY: 0, resistivity: .003, viscosity: .002,
    thermalConductivity: .003, concentrationDiffusivity: .001,
    phaseDiffusivity: .03, phaseGrowth: 1, phaseNonlinearity: 1, phaseDispersion: .3,
    phaseFrequency: .5, phaseThermalCoupling: .15, phaseDensityCoupling: .1,
    phaseMagneticCoupling: .1, phaseSeedAmplitude: .7,
    temperatureScaleK: 20000, nucleiDensityM3: 1e15, timeScaleSeconds: 1,
    ironTemperatureK: 1400, ironContrast: .5, ironHeatingWkg: 4000,
    ironBathCouplingWkgK: .05, ironLengthM: .1, ironConductivityWMK: 80, cfl: .2 });
  const RANGES = Object.freeze({ resolution: [16, 64], length: [1, 20], density: [.1, 10], pressure: [.1, 10],
    densityContrast: [0, .5], temperatureContrast: [0, .5], flowSpeed: [0, 1], magneticStrength: [0, 2],
    guideFieldX: [-2, 2], guideFieldY: [-2, 2], resistivity: [0, .1], viscosity: [0, .1],
    thermalConductivity: [0, .1], concentrationDiffusivity: [0, .1], phaseDiffusivity: [0, .2],
    phaseGrowth: [-1, 2], phaseNonlinearity: [.1, 3], phaseDispersion: [-1, 1], phaseFrequency: [-1, 1],
    phaseThermalCoupling: [0, 1], phaseDensityCoupling: [0, 1], phaseMagneticCoupling: [0, 1], phaseSeedAmplitude: [.1, 2],
    temperatureScaleK: [1000, 1e6], nucleiDensityM3: [1e10, 1e22], timeScaleSeconds: [.01, 100],
    ironTemperatureK: [100, 20000], ironContrast: [0, .8], ironHeatingWkg: [-1e4, 1e5],
    ironBathCouplingWkgK: [0, 1], ironLengthM: [.01, 1], ironConductivityWMK: [0, 100], cfl: [.02, .35] });
  const GAMMA = 5 / 3, CV = 1 / (GAMMA - 1), KB = 1.380649e-23, MP = 1.67262192369e-27,
    ME = 9.1093837139e-31, PLANCK = 6.62607015e-34, EV = 1.602176634e-19, MU0 = 4 * Math.PI * 1e-7;
  const IRON = Object.freeze({ referenceTemperatureK: 298.15, meltingK: 1811, boilingK: 3134,
    solidCpJkgK: 450, liquidCpJkgK: 820, vaporCpJkgK: 372.2,
    fusionJkg: 13810 / .055845, vaporizationJkg: 340000 / .055845,
    referenceDensityKgM3: 7874, firstIonizationEv: 7.9024681, referenceVaporNucleiM3: 1e20,
    pressurePa: 1e5, scope: 'Approximate isobaric iron enthalpy laboratory. Constant heat capacities and declared latent heats; no expansion, solid mechanics, pressure-dependent phase diagram or black-hole cover inference. LTE first-ionization partition is a reference diagnostic and does not enter enthalpy.' });
  const SCOPES = Object.freeze({
    mhd: 'Computed 2D Cartesian periodic compressible nonrelativistic ideal-gas MHD with resistive, viscous and heat-conduction fluxes. Fixed gamma=5/3, mean molecular weight=0.5. No relativistic plasma, Kerr gravity, accretion, radiation or solid cover dynamics.',
    complexPhase: 'Computed neutral advected cubic complex Ginzburg-Landau field. Plasma temperature, density and magnetic energy alter declared phenomenological growth coefficients. One-way coupling; this is not a quantum condensate, charged wavefunction or measured astronomical phase.',
    magneticPhase: 'arg(Bx+i By) is in-plane magnetic direction. Field zeros and plaquette winding indicators are finite-grid measurements; no flux quantization or superconducting interpretation.',
    ionization: 'Hydrogen LTE ground-state Saha reference at local temperature and nuclei density. Ionization energy and variable particle number do not alter the fixed MHD ideal-gas EOS. LTE is not established here and this diagnostic is not valid evidence for optically thin EHT plasma.',
    iron: IRON.scope,
    geometry: 'The local periodic patch and separate iron parcel grid can be displayed near the aperture/aggie illustration. This mapping is a display choice; no near-horizon spacetime or actual condensed surface is solved.' });
  function validateParameters(patch, current) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch) || ![Object.prototype, null].includes(Object.getPrototypeOf(patch))) throw new TypeError('Phase parameters must be a plain object.');
    const next = Object.assign({}, current || DEFAULTS);
    for (const key of Reflect.ownKeys(patch)) {
      if (typeof key !== 'string' || !Object.hasOwn(RANGES, key)) throw new RangeError('Unknown phase parameter: ' + String(key));
      const descriptor = Object.getOwnPropertyDescriptor(patch, key), range = RANGES[key];
      if (!Object.hasOwn(descriptor, 'value')) throw new TypeError('Phase parameters must contain data properties.');
      const value = descriptor.value;
      if (typeof value !== 'number' || !Number.isFinite(value) || value < range[0] || value > range[1] ||
        (key === 'resolution' && ![16, 32, 64].includes(value))) throw new RangeError(key + ' is outside ' + range.join('..'));
      next[key] = value;
    }
    return next;
  }
  function sahaFraction(temperatureK, nucleiM3, ionizationEv, statisticalFactor) {
    if (!(temperatureK > 0) || !(nucleiM3 > 0) || !Number.isFinite(temperatureK) || !Number.isFinite(nucleiM3)) throw new RangeError('Saha temperature and nuclei density must be positive and finite.');
    const logRatio = Math.log(statisticalFactor === undefined ? 1 : statisticalFactor) +
      1.5 * Math.log(2 * Math.PI * ME * KB * temperatureK / (PLANCK * PLANCK)) -
      (ionizationEv === undefined ? 13.598434599702 : ionizationEv) * EV / (KB * temperatureK) - Math.log(nucleiM3);
    if (logRatio < -700) return 0;
    if (logRatio > 100) return 1;
    const ratio = Math.exp(logRatio);
    return 2 / (1 + Math.sqrt(1 + 4 / ratio));
  }
  const HM = IRON.solidCpJkgK * (IRON.meltingK - IRON.referenceTemperatureK),
    HL = HM + IRON.fusionJkg, HB = HL + IRON.liquidCpJkgK * (IRON.boilingK - IRON.meltingK), HG = HB + IRON.vaporizationJkg;
  function ironEnthalpy(temperatureK) {
    if (!(temperatureK > 0) || !Number.isFinite(temperatureK)) throw new RangeError('Iron temperature must be positive and finite.');
    if (temperatureK < IRON.meltingK) return IRON.solidCpJkgK * (temperatureK - IRON.referenceTemperatureK);
    if (temperatureK < IRON.boilingK) return HL + IRON.liquidCpJkgK * (temperatureK - IRON.meltingK);
    return HG + IRON.vaporCpJkgK * (temperatureK - IRON.boilingK);
  }
  function ironFromEnthalpy(enthalpyJkg) {
    if (!Number.isFinite(enthalpyJkg)) throw new RangeError('Iron enthalpy must be finite.');
    let temperatureK, solid = 0, liquid = 0, vapor = 0;
    if (enthalpyJkg < HM) { temperatureK = IRON.referenceTemperatureK + enthalpyJkg / IRON.solidCpJkgK; solid = 1; }
    else if (enthalpyJkg < HL) { temperatureK = IRON.meltingK; liquid = (enthalpyJkg - HM) / IRON.fusionJkg; solid = 1 - liquid; }
    else if (enthalpyJkg < HB) { temperatureK = IRON.meltingK + (enthalpyJkg - HL) / IRON.liquidCpJkgK; liquid = 1; }
    else if (enthalpyJkg < HG) { temperatureK = IRON.boilingK; vapor = (enthalpyJkg - HB) / IRON.vaporizationJkg; liquid = 1 - vapor; }
    else { temperatureK = IRON.boilingK + (enthalpyJkg - HG) / IRON.vaporCpJkgK; vapor = 1; }
    const ion = temperatureK > 0 ? sahaFraction(temperatureK, IRON.referenceVaporNucleiM3, IRON.firstIonizationEv, 2) : 0;
    return { temperatureK, solidFraction: solid, liquidFraction: liquid, vaporFraction: vapor * (1 - ion), plasmaFraction: vapor * ion };
  }
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  function winding(re, im, n, length, relativeThreshold) {
    const maxAmplitude = Math.max(1e-30, ...Array.from(re, (r, i) => Math.hypot(r, im[i]))), floor = maxAmplitude * (relativeThreshold || 1e-6),
      phase = Array.from(re, (r, i) => Math.atan2(im[i], r)), index = (i, j) => ((j + n) % n) * n + ((i + n) % n), defects = [];
    let net = 0, ambiguousEdges = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const corners = [index(i,j), index(i+1,j), index(i+1,j+1), index(i,j+1)];
      let sum = 0, minimumCornerAmplitude = Infinity, resolved = true;
      for (let k = 0; k < 4; k++) {
        const p = corners[k], q = corners[(k + 1) % 4], delta = wrap(phase[q] - phase[p]);
        sum += delta; minimumCornerAmplitude = Math.min(minimumCornerAmplitude, Math.hypot(re[p], im[p]));
        if (Math.abs(Math.abs(delta) - Math.PI) < 1e-7) { resolved = false; ambiguousEdges++; }
      }
      if (minimumCornerAmplitude < floor) resolved = false;
      const charge = Math.round(sum / (2 * Math.PI));
      if (charge) { net += charge; defects.push({ix:i,iy:j,x:((i+1)%n)*length/n,y:((j+1)%n)*length/n,charge,minimumCornerAmplitude,resolved}); }
    }
    return {defects,netWinding:net,ambiguousEdges,amplitudeFloor:floor,
      convention:'Counterclockwise wrapped phase differences around four cell-center corners; location is plaquette center, not a subcell fitted vortex. Undefined/near-pi edge samples are flagged unresolved.'};
  }
  function createModel(input, initialCondition) {
    let parameters = validateParameters(input || {}), state, initialMass = 0, initialEnergy = 0, initialIronMean = 0,
      time = 0, sequence = 0, acceptedSteps = 0, rejectedSteps = 0, lastDt = 0, externalIronMean = 0,
      estimatedOhmicHeat = 0, estimatedViscousHeat = 0, status = 'ready', error = null;
    const ix = (i,j,n) => ((j+n)%n)*n+((i+n)%n);
    const blank = n => ({u:Array.from({length:5},()=>new Float64Array(n*n)),bx:new Float64Array(n*n),by:new Float64Array(n*n),re:new Float64Array(n*n),im:new Float64Array(n*n),h:new Float64Array(n*n)});
    function primitives(s) {
      const n = parameters.resolution, size = n*n, out = {rho:s.u[0],vx:new Float64Array(size),vy:new Float64Array(size),p:new Float64Array(size),t:new Float64Array(size),bx:new Float64Array(size),by:new Float64Array(size),c:new Float64Array(size),ironT:new Float64Array(size)};
      let minDensity = Infinity, minPressure = Infinity, maxSignal = 0, maxAmplitude = 0;
      for (let j=0;j<n;j++) for(let i=0;i<n;i++) {
        const k=ix(i,j,n), bx=.5*(s.bx[k]+s.bx[ix(i+1,j,n)]), by=.5*(s.by[k]+s.by[ix(i,j+1,n)]), rho=s.u[0][k], vx=s.u[1][k]/rho,vy=s.u[2][k]/rho,
          p=(GAMMA-1)*(s.u[3][k]-.5*rho*(vx*vx+vy*vy)-.5*(bx*bx+by*by));
        out.bx[k]=bx;out.by[k]=by;out.vx[k]=vx;out.vy[k]=vy;out.p[k]=p;out.t[k]=p/rho;out.c[k]=s.u[4][k]/rho;out.ironT[k]=ironFromEnthalpy(s.h[k]).temperatureK;
        minDensity=Math.min(minDensity,rho);minPressure=Math.min(minPressure,p);
        maxSignal=Math.max(maxSignal,Math.abs(vx)+Math.sqrt(Math.max(0,GAMMA*p/rho+(bx*bx+by*by)/rho)),Math.abs(vy)+Math.sqrt(Math.max(0,GAMMA*p/rho+(bx*bx+by*by)/rho)));
        maxAmplitude=Math.max(maxAmplitude,Math.hypot(s.re[k],s.im[k]));
      }
      return Object.assign(out,{minDensity,minPressure,maxSignal,maxAmplitude});
    }
    function check(s, p) {
      const v=p||primitives(s);
      if (!(v.minDensity>1e-10) || !(v.minPressure>1e-10)) throw new Error('Numerical positivity failure; no density or pressure floors were applied.');
      for (const a of [...s.u,s.bx,s.by,s.re,s.im,s.h]) for (const x of a) if (!Number.isFinite(x)) throw new Error('Non-finite numerical state.');
      for(let k=0;k<v.rho.length;k++) if (!(v.ironT[k]>1) || v.c[k]<-1e-8 || v.c[k]>1+1e-8) throw new Error('Material temperature or passive concentration outside numerical domain.');
      if(v.maxAmplitude>20)throw new Error('Order-parameter amplitude exceeded the declared numerical domain.');
      return v;
    }
    function initialize() {
      const n=parameters.resolution,L=parameters.length,d=L/n,a=new Float64Array(n*n);state=blank(n);
      const sample=(x,y)=>initialCondition?initialCondition(x,y):{};
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const k=ix(i,j,n),x=i*d,y=j*d,v=sample(x,y),xx=2*Math.PI*x/L,yy=2*Math.PI*y/L;
        a[k]=v.magneticPotential===undefined?parameters.magneticStrength*(Math.cos(yy)+.5*Math.cos(2*xx))*L/(2*Math.PI):v.magneticPotential;
      }
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const k=ix(i,j,n);state.bx[k]=parameters.guideFieldX-(a[ix(i,j+1,n)]-a[k])/d;state.by[k]=parameters.guideFieldY+(a[ix(i+1,j,n)]-a[k])/d;
      }
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const k=ix(i,j,n),x=(i+.5)*d,y=(j+.5)*d,v=sample(x,y),xx=2*Math.PI*x/L,yy=2*Math.PI*y/L,
          rho=v.density===undefined?parameters.density*(1+parameters.densityContrast*Math.cos(xx)*Math.cos(yy)):v.density,
          p=v.pressure===undefined?parameters.pressure*(1+parameters.temperatureContrast*Math.sin(xx)*Math.cos(yy)):v.pressure,
          vx=v.vx===undefined?-parameters.flowSpeed*Math.sin(yy):v.vx,vy=v.vy===undefined?parameters.flowSpeed*Math.sin(xx):v.vy,
          bx=.5*(state.bx[k]+state.bx[ix(i+1,j,n)]),by=.5*(state.by[k]+state.by[ix(i,j+1,n)]),
          c=v.concentration===undefined?.5+.25*Math.sin(xx)*Math.sin(yy):v.concentration,
          ironT=v.ironTemperatureK===undefined?parameters.ironTemperatureK*(1+parameters.ironContrast*Math.cos(xx)*Math.cos(yy)):v.ironTemperatureK;
        state.u[0][k]=rho;state.u[1][k]=rho*vx;state.u[2][k]=rho*vy;state.u[3][k]=p/(GAMMA-1)+.5*rho*(vx*vx+vy*vy)+.5*(bx*bx+by*by);state.u[4][k]=rho*c;
        state.re[k]=v.psiRe===undefined?parameters.phaseSeedAmplitude*Math.cos(xx+.37):v.psiRe;
        state.im[k]=v.psiIm===undefined?parameters.phaseSeedAmplitude*Math.cos(yy+.53):v.psiIm;state.h[k]=ironEnthalpy(ironT);
      }
      check(state);time=sequence=acceptedSteps=rejectedSteps=lastDt=externalIronMean=estimatedOhmicHeat=estimatedViscousHeat=0;status='ready';error=null;
      initialMass=sum(state.u[0])*d*d;initialEnergy=sum(state.u[3])*d*d;initialIronMean=sum(state.h)/(n*n);
    }
    const sum=a=>{let s=0;for(const v of a)s+=v;return s;};
    function rhs(s, pr) {
      const n=parameters.resolution,d=parameters.length/n,size=n*n,out=blank(n),p=pr||primitives(s),fx=new Float64Array(6*size),fy=new Float64Array(6*size),edge=new Float64Array(size),current=new Float64Array(size);
      const central=(a,i,j,axis)=>axis===0?(a[ix(i+1,j,n)]-a[ix(i-1,j,n)])/(2*d):(a[ix(i,j+1,n)]-a[ix(i,j-1,n)])/(2*d);
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=ix(i,j,n);current[k]=(s.by[k]-s.by[ix(i-1,j,n)])/d-(s.bx[k]-s.bx[ix(i,j-1,n)])/d;}
      function flux(k,normalB,axis) {
        const rho=p.rho[k],vx=p.vx[k],vy=p.vy[k],pressure=p.p[k],bx=axis===0?normalB:p.bx[k],by=axis===1?normalB:p.by[k],v=axis===0?vx:vy,
          energy=pressure/(GAMMA-1)+.5*rho*(vx*vx+vy*vy)+.5*(bx*bx+by*by),pt=pressure+.5*(bx*bx+by*by),bn=axis===0?bx:by;
        return {u:[rho,rho*vx,rho*vy,energy,rho*p.c[k],axis===0?by:bx],
          f:[rho*v,rho*vx*v+(axis===0?pt:0)-bx*bn,rho*vy*v+(axis===1?pt:0)-by*bn,(energy+pt)*v-(bx*vx+by*vy)*bn,rho*p.c[k]*v,axis===0?vx*by-vy*bx:vy*bx-vx*by],
          signal:Math.abs(v)+Math.sqrt(Math.max(0,GAMMA*pressure/rho+(bx*bx+by*by)/rho))};
      }
      for(let j=0;j<n;j++)for(let i=0;i<n;i++)for(let axis=0;axis<2;axis++){
        const k=ix(i,j,n),l=axis===0?ix(i-1,j,n):ix(i,j-1,n),normalB=axis===0?s.bx[k]:s.by[k],left=flux(l,normalB,axis),right=flux(k,normalB,axis),speed=Math.max(left.signal,right.signal),f=axis===0?fx:fy;
        for(let z=0;z<6;z++)f[6*k+z]=.5*(left.f[z]+right.f[z])-.5*speed*(right.u[z]-left.u[z]);
        const jface=axis===0?.5*(current[k]+current[ix(i,j+1,n)]):.5*(current[k]+current[ix(i+1,j,n)]),tangentB=axis===0?.5*(p.by[l]+p.by[k]):.5*(p.bx[l]+p.bx[k]);
        f[6*k+3]+=parameters.resistivity*jface*tangentB*(axis===0?-1:1)-parameters.thermalConductivity*(p.t[k]-p.t[l])/d;
        f[6*k+4]-=parameters.concentrationDiffusivity*.5*(p.rho[k]+p.rho[l])*(p.c[k]-p.c[l])/d;
        if(parameters.viscosity){
          const li=axis===0?i-1:i,lj=axis===1?j-1:j,
            vxX=axis===0?(p.vx[k]-p.vx[l])/d:.5*(central(p.vx,i,j,0)+central(p.vx,li,lj,0)),
            vyY=axis===1?(p.vy[k]-p.vy[l])/d:.5*(central(p.vy,i,j,1)+central(p.vy,li,lj,1)),
            vyX=axis===0?(p.vy[k]-p.vy[l])/d:.5*(central(p.vy,i,j,0)+central(p.vy,li,lj,0)),
            vxY=axis===1?(p.vx[k]-p.vx[l])/d:.5*(central(p.vx,i,j,1)+central(p.vx,li,lj,1)),div=vxX+vyY,
            xx=parameters.viscosity*(2*vxX-2*div/3),yy=parameters.viscosity*(2*vyY-2*div/3),xy=parameters.viscosity*(vxY+vyX),tx=axis===0?xx:xy,ty=axis===0?xy:yy;
          f[6*k+1]-=tx;f[6*k+2]-=ty;f[6*k+3]-=tx*.5*(p.vx[l]+p.vx[k])+ty*.5*(p.vy[l]+p.vy[k]);
        }
      }
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const k=ix(i,j,n);
        // Shared corner EMF; discrete divergence of its curl cancels exactly.
        edge[k]=.25*(-fx[6*k+5]-fx[6*ix(i,j-1,n)+5]+fy[6*k+5]+fy[6*ix(i-1,j,n)+5])+parameters.resistivity*current[k];
      }
      let ironPowerMean=0,ohmic=0,viscous=0;
      const ironDx=parameters.ironLengthM/n,ironMassConductivity=parameters.ironConductivityWMK/IRON.referenceDensityKgM3;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const k=ix(i,j,n),xp=ix(i+1,j,n),xm=ix(i-1,j,n),yp=ix(i,j+1,n),ym=ix(i,j-1,n);
        for(let z=0;z<5;z++)out.u[z][k]=-(fx[6*xp+z]-fx[6*k+z]+fy[6*yp+z]-fy[6*k+z])/d;
        out.bx[k]=-(edge[yp]-edge[k])/d;out.by[k]=(edge[xp]-edge[k])/d;
        const lapRe=(s.re[xp]+s.re[xm]+s.re[yp]+s.re[ym]-4*s.re[k])/(d*d),lapIm=(s.im[xp]+s.im[xm]+s.im[yp]+s.im[ym]-4*s.im[k])/(d*d),
          adv=a=>p.vx[k]*(p.vx[k]>=0?(a[k]-a[xm])/d:(a[xp]-a[k])/d)+p.vy[k]*(p.vy[k]>=0?(a[k]-a[ym])/d:(a[yp]-a[k])/d),
          amplitude2=s.re[k]*s.re[k]+s.im[k]*s.im[k],growth=parameters.phaseGrowth-parameters.phaseThermalCoupling*(p.t[k]-1)+parameters.phaseDensityCoupling*(p.rho[k]-1)-parameters.phaseMagneticCoupling*(p.bx[k]*p.bx[k]+p.by[k]*p.by[k]),
          reaction=growth-parameters.phaseNonlinearity*amplitude2,rotation=parameters.phaseFrequency*amplitude2;
        out.re[k]=-adv(s.re)+parameters.phaseDiffusivity*(lapRe-parameters.phaseDispersion*lapIm)+reaction*s.re[k]+rotation*s.im[k];
        out.im[k]=-adv(s.im)+parameters.phaseDiffusivity*(lapIm+parameters.phaseDispersion*lapRe)+reaction*s.im[k]-rotation*s.re[k];
        const source=parameters.ironHeatingWkg+parameters.ironBathCouplingWkgK*(p.t[k]*parameters.temperatureScaleK-p.ironT[k]);
        out.h[k]=parameters.timeScaleSeconds*(ironMassConductivity*(p.ironT[xp]+p.ironT[xm]+p.ironT[yp]+p.ironT[ym]-4*p.ironT[k])/(ironDx*ironDx)+source);ironPowerMean+=source/size;
        ohmic+=parameters.resistivity*current[k]*current[k]*d*d;
        const vxX=central(p.vx,i,j,0),vyY=central(p.vy,i,j,1),xy=central(p.vx,i,j,1)+central(p.vy,i,j,0),div=vxX+vyY;
        viscous+=parameters.viscosity*(2*(vxX*vxX+vyY*vyY)-2*div*div/3+xy*xy)*d*d;
      }
      return {out,ironPowerMean,ohmic,viscous};
    }
    function combine(s,a,factor,b,secondFactor) {
      const n=parameters.resolution,result=blank(n),names=['bx','by','re','im','h'];
      for(let z=0;z<5;z++)for(let k=0;k<n*n;k++)result.u[z][k]=s.u[z][k]+factor*a.u[z][k]+(b?secondFactor*b.u[z][k]:0);
      for(const name of names)for(let k=0;k<n*n;k++)result[name][k]=s[name][k]+factor*a[name][k]+(b?secondFactor*b[name][k]:0);
      return result;
    }
    function stableDt(p) {
      const d=parameters.length/parameters.resolution,ironD=parameters.ironLengthM/parameters.resolution;
      let dt=parameters.cfl*d/(2*Math.max(1e-12,p.maxSignal));
      const diffusion=Math.max(parameters.resistivity,parameters.viscosity/p.minDensity,parameters.thermalConductivity/(p.minDensity*CV),parameters.concentrationDiffusivity,parameters.phaseDiffusivity*Math.sqrt(1+parameters.phaseDispersion*parameters.phaseDispersion));
      if(diffusion)dt=Math.min(dt,.2*d*d/diffusion);
      if(parameters.ironConductivityWMK)dt=Math.min(dt,.2*ironD*ironD*IRON.referenceDensityKgM3*IRON.vaporCpJkgK/(parameters.ironConductivityWMK*parameters.timeScaleSeconds));
      dt=Math.min(dt,.15/(1+Math.abs(parameters.phaseGrowth)+3*(parameters.phaseNonlinearity+Math.abs(parameters.phaseFrequency))*p.maxAmplitude*p.maxAmplitude));
      return dt;
    }
    function step(dt) {
      if(typeof dt!=='number'||!Number.isFinite(dt)||dt<0||dt>1)throw new RangeError('Step must be finite in0..1 local time units.');
      if(!dt)return snapshot();
      const before=state,ledger={time,sequence,acceptedSteps,lastDt,externalIronMean,estimatedOhmicHeat,estimatedViscousHeat};
      let remaining=dt,substeps=0;
      try {
        while(remaining>Math.max(1e-14,dt*1e-12)){
          if(++substeps>512)throw new Error('Step exceeded512 substeps; reduce the requested time interval or material stiffness.');
          const p=check(state),a=rhs(state,p);let h=Math.min(remaining,stableDt(p)),done=false;
          for(let retry=0;retry<10;retry++){
            try {
              const predictor=combine(state,a.out,h);check(predictor);const b=rhs(predictor),candidate=combine(state,a.out,h/2,b.out,h/2);check(candidate);
              state=candidate;remaining-=h;time+=h;lastDt=h;acceptedSteps++;
              externalIronMean+=h*parameters.timeScaleSeconds*.5*(a.ironPowerMean+b.ironPowerMean);
              estimatedOhmicHeat+=h*.5*(a.ohmic+b.ohmic);estimatedViscousHeat+=h*.5*(a.viscous+b.viscous);done=true;break;
            }catch(failure){rejectedSteps++;h*=.5;if(retry===9)throw failure;}
          }
          if(!done)throw new Error('Adaptive substep failed.');
        }
        sequence++;status='ready';error=null;
      }catch(failure){state=before;time=ledger.time;sequence=ledger.sequence;acceptedSteps=ledger.acceptedSteps;lastDt=ledger.lastDt;externalIronMean=ledger.externalIronMean;estimatedOhmicHeat=ledger.estimatedOhmicHeat;estimatedViscousHeat=ledger.estimatedViscousHeat;status='error';error=failure.message;throw failure;}
      return snapshot();
    }
    function snapshot() {
      const n=parameters.resolution,L=parameters.length,d=L/n,p=primitives(state),size=n*n,
        f={density:Array.from(p.rho),concentration:Array.from(p.c),temperature:Array.from(p.t),temperatureK:Array.from(p.t,t=>t*parameters.temperatureScaleK),vx:Array.from(p.vx),vy:Array.from(p.vy),bx:Array.from(p.bx),by:Array.from(p.by),magneticStrength:[],currentZ:[],electricZ:[],psiRe:Array.from(state.re),psiIm:Array.from(state.im),phase:[],amplitude:[],magneticPhase:[],hydrogenIonization:[],phaseDefined:[],magneticPhaseDefined:[]},
        material={temperatureK:[],enthalpyJkg:Array.from(state.h),solidFraction:[],liquidFraction:[],vaporFraction:[],plasmaFraction:[],scope:IRON.scope,constants:Object.assign({},IRON)},
        complex=winding(state.re,state.im,n,L),magnetic=winding(p.bx,p.by,n,L),maxB=Math.max(1e-30,...Array.from(p.bx,(b,k)=>Math.hypot(b,p.by[k])));
      let maxDivB=0,magneticNullCount=0,minIronTemperature=Infinity;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const k=ix(i,j,n),b=Math.hypot(p.bx[k],p.by[k]),amp=Math.hypot(state.re[k],state.im[k]),current=(p.by[ix(i+1,j,n)]-p.by[ix(i-1,j,n)]-p.bx[ix(i,j+1,n)]+p.bx[ix(i,j-1,n)])/(2*d),defined=amp>=complex.amplitudeFloor,magDefined=b>=maxB*1e-6;
        f.magneticStrength.push(b);f.currentZ.push(current);f.electricZ.push(p.vy[k]*p.bx[k]-p.vx[k]*p.by[k]+parameters.resistivity*current);f.amplitude.push(amp);f.phase.push(defined?Math.atan2(state.im[k],state.re[k]):0);f.magneticPhase.push(magDefined?Math.atan2(p.by[k],p.bx[k]):0);f.phaseDefined.push(defined?1:0);f.magneticPhaseDefined.push(magDefined?1:0);if(!magDefined)magneticNullCount++;
        f.hydrogenIonization.push(sahaFraction(f.temperatureK[k],p.rho[k]*parameters.nucleiDensityM3));
        const iron=ironFromEnthalpy(state.h[k]);minIronTemperature=Math.min(minIronTemperature,iron.temperatureK);for(const name of ['temperatureK','solidFraction','liquidFraction','vaporFraction','plasmaFraction'])material[name].push(iron[name]);
        maxDivB=Math.max(maxDivB,Math.abs((state.bx[ix(i+1,j,n)]-state.bx[k]+state.by[ix(i,j+1,n)]-state.by[k])/d));
      }
      const mass=sum(state.u[0])*d*d,totalEnergy=sum(state.u[3])*d*d,relativeMassError=Math.abs(mass-initialMass)/Math.max(1e-30,initialMass),relativeEnergyError=Math.abs(totalEnergy-initialEnergy)/Math.max(1e-30,initialEnergy),
        ironMean=sum(state.h)/size,ironBalanceError=ironMean-initialIronMean-externalIronMean,
        velocityMps=Math.sqrt(KB*parameters.temperatureScaleK/(.5*MP)),lengthM=velocityMps*parameters.timeScaleSeconds,densityKgM3=MP*parameters.nucleiDensityM3,magneticTesla=velocityMps*Math.sqrt(MU0*densityKgM3);
      return {schema:'GFM-Phase-MHD-frame/1',sequence,time,physicalSeconds:time*parameters.timeScaleSeconds,parameters:Object.assign({},parameters),
        grid:{nx:n,ny:n,length:L,dx:d,dy:d,ordering:'x-fast row-major',boundary:'periodic',dimension:2},fields:f,
        staggeredMagneticField:{bxFaces:Array.from(state.bx),byFaces:Array.from(state.by),convention:'Bx at(i*dx,(j+.5)*dy), By at((i+.5)*dx,j*dy); periodic arrays with nx*ny faces per component.'},
        conserved:{density:Array.from(state.u[0]),momentumX:Array.from(state.u[1]),momentumY:Array.from(state.u[2]),totalEnergy:Array.from(state.u[3]),concentrationMass:Array.from(state.u[4])},
        defects:complex.defects,magneticDefects:magnetic.defects,materials:{iron:material},
        diagnostics:{status,error,mass,totalEnergy,initialMass,initialEnergy,relativeMassError,relativeEnergyError,maxDivB,
          normalizedDivB:maxDivB*d/Math.max(1,maxB),minDensity:p.minDensity,minPressure:p.minPressure,minIronTemperatureK:minIronTemperature,
          acceptedSteps,rejectedSteps,lastDt,cfl:parameters.cfl,netWinding:complex.netWinding,defectCount:complex.defects.length,
          unresolvedDefects:complex.defects.filter(v=>!v.resolved).length,magneticNullCount,magneticNetWinding:magnetic.netWinding,
          ironMeanEnthalpyJkg:ironMean,ironExternalHeatJkg:externalIronMean,ironBalanceErrorJkg:ironBalanceError,
          estimatedResolvedOhmicHeat:estimatedOhmicHeat,estimatedResolvedViscousHeat:estimatedViscousHeat,
          passed:status==='ready'&&relativeMassError<1e-8&&relativeEnergyError<1e-8&&maxDivB*d/Math.max(1,maxB)<1e-10,
          method:'First-order Rusanov finite-volume fluxes; shared-corner constrained transport; SSP RK2; CFL/diffusion/reaction limits with rejected positivity steps. Numerical diffusion is present and must be tested by refinement.',
          criteria:'Periodic global mass and total MHD energy relative residual<1e-8; normalized staggered divergence<1e-10; finite positive density/pressure/material temperature. Passing is numerical consistency, not empirical validation.'},
        units:{time:'t0=L0/v0; see normalization',density:'rho0',temperature:'p/rho in T0',temperatureK:'K',velocity:'v0',magneticField:'v0 sqrt(mu0 rho0)',electricField:'v0 B0',current:'B0/(mu0 L0)',ironTemperature:'K',ironEnthalpy:'J/kg',
          normalization:{temperatureScaleK:parameters.temperatureScaleK,nucleiDensityM3:parameters.nucleiDensityM3,timeScaleSeconds:parameters.timeScaleSeconds,velocityMps,lengthM,densityKgM3,magneticTesla,meanMolecularWeight:.5,gamma:GAMMA}},
        conventions:{complex:complex.convention,phaseUndefined:'Phase set to0 solely for JSON-safe transport; phaseDefined/magneticPhaseDefined mark undefined low-amplitude cells.',
          materialPartition:'solid+liquid+neutral vapor+first-ionized plasma fractions sum to1. Plasma is a diagnostic partition of vapor, not an extra fraction or latent heat source.',
          reset:'Changing any parameter reinitializes the deterministic experiment at time0. Custom initial-condition callback is a trusted local testing interface and is never accepted over HTTP.'},scopes:Object.assign({},SCOPES)};
    }
    function reinitialize(nextParameters) {
      // Trusted custom initial conditions can throw or return invalid samples.
      // Restore the complete previous experiment before surfacing that failure.
      const saved={parameters,state,initialMass,initialEnergy,initialIronMean,time,sequence,acceptedSteps,rejectedSteps,lastDt,externalIronMean,estimatedOhmicHeat,estimatedViscousHeat,status,error};
      try {parameters=nextParameters;initialize();}
      catch(failure){({parameters,state,initialMass,initialEnergy,initialIronMean,time,sequence,acceptedSteps,rejectedSteps,lastDt,externalIronMean,estimatedOhmicHeat,estimatedViscousHeat,status,error}=saved);throw failure;}
      return snapshot();
    }
    function setParameters(patch) {return reinitialize(validateParameters(patch,parameters));}
    function reset(){return reinitialize(parameters);}
    initialize();return {step,setParameters,snapshot,reset};
  }
  return Object.freeze({createModel,validateParameters,DEFAULTS,RANGES,IRON,sahaFraction,ironEnthalpy,ironFromEnthalpy,winding});
}));
