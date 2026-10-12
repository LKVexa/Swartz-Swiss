'use strict';
// One-time migration of the installed viewer; original numerical sources stay intact.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=path.join(__dirname,'public/app.js');let source=fs.readFileSync(file,'utf8');
function replace(old,value){if(!source.includes(old))throw Error('Missing migration anchor: '+old.slice(0,100));source=source.replace(old,value);}
source=source.replace(/function displayScales\(\)\{[^\n]+\}/,String.raw`function displayScales(){return {electricVPerM:Math.max(1e-9,Number($('electricScale').value)),magneticMicroTesla:Math.max(1e-9,Number($('magneticScale').value)),fluxWPerM2:Math.max(1e-9,Number($('fluxScale').value)),plasmaTemperatureK:Math.max(1,Number($('plasmaTemperatureScale').value)),plasmaTemperatureRiseK:Math.max(1e-9,Number($('plasmaTemperatureRiseScale').value)),coverTemperatureK:Math.max(1,Number($('coverTemperatureScale').value)),coverHeatingWPerM3:Math.max(1e-9,Number($('coverHeatingScale').value)),plasmaPowerWPerM3:Math.max(1e-12,Number($('plasmaPowerScale').value)),plasmaDepositedJPerM3:Math.max(1e-18,Number($('plasmaDepositedScale').value)),coverDepositedJPerM3:Math.max(1e-18,Number($('coverDepositedScale').value))};}
function pulseViewOptions(){return {scales:displayScales(),yaw:scene?.yaw,pitch:scene?.pitch,cutaway:$('cutaway').checked,showPhase:$('show-phase-layer').checked,showPlasma:$('show-plasma-layer').checked,showCover:$('show-cover-layer').checked,showVectors:$('vectors').checked,presentationShape:$('presentation-shape').value,showEnergyFlow:$('show-energy-flow').checked,absorptionLayer:$('absorption-layer').value,coverResponseLayer:$('cover-response-layer').value};}`);
replace("return combinedLayerGeometry(f,{scales:displayScales(),yaw:scene?.yaw,pitch:scene?.pitch,cutaway:$('cutaway').checked,showPhase:$('show-phase-layer').checked,showPlasma:$('show-plasma-layer').checked,showCover:$('show-cover-layer').checked,showVectors:$('vectors').checked});","return combinedLayerGeometry(f,pulseViewOptions());");
replace("combinedPhysicalLayers(frame,displayScales()):physicalLayer", "combinedPhysicalLayers(frame,displayScales(),pulseViewOptions()):physicalLayer");
replace("'show-plasma-layer','show-cover-layer']", "'show-plasma-layer','show-cover-layer','presentation-shape','show-energy-flow','absorption-layer','cover-response-layer']");
replace("'coverTemperatureScale','coverHeatingScale']", "'coverTemperatureScale','coverHeatingScale','plasmaPowerScale','plasmaDepositedScale','coverDepositedScale']");
replace("$('combined-layer-controls').hidden=!combined;", "$('combined-layer-controls').hidden=!combined;$('pulse-view-controls').hidden=!combined;$('pulse-energy-panel').hidden=!combined;");
replace("$('combined-layer-controls').hidden=mode!=='em'||$('field-layer').value!=='combined';", "$('combined-layer-controls').hidden=mode!=='em'||$('field-layer').value!=='combined';$('pulse-view-controls').hidden=mode!=='em'||$('field-layer').value!=='combined';$('pulse-energy-panel').hidden=mode!=='em'||$('field-layer').value!=='combined';");
replace("'plasma ΔT / Tref'", "'plasma / reference'");
replace("'cover q / qref'", "'cover / reference'");
replace("setText('combined-plasma-scale','ΔTp 0 … '+fmt(parts.plasma.hi,'K')+' · peak '+fmt(peak(parts.plasma),'K')+' · '+shown('show-plasma-layer')+' · '+parts.plasma.below+' below scale (cooling), '+parts.plasma.above+' above scale'+(parts.plasma.validCount?'':' · no plasma / masked'));", "setText('combined-plasma-scale',parts.plasma.title+' · 0 … '+fmt(parts.plasma.hi,parts.plasma.unit)+' · peak '+fmt(peak(parts.plasma),parts.plasma.unit)+' · '+shown('show-plasma-layer')+' · '+parts.plasma.below+' below, '+parts.plasma.above+' above scale'+(parts.plasma.validCount?'':' · no plasma / masked'));");
replace("setText('combined-cover-scale','qc 0 … '+fmt(parts.cover.hi,'W/m³')+' · peak '+fmt(peak(parts.cover),'W/m³')+' · '+shown('show-cover-layer')+' · '+parts.cover.clipped+' clipped');", "setText('combined-cover-scale',parts.cover.title+' · 0 … '+fmt(parts.cover.hi,parts.cover.unit)+' · peak '+fmt(peak(parts.cover),parts.cover.unit)+' · '+shown('show-cover-layer')+' · '+parts.cover.clipped+' clipped');");
replace("'Envelope / Vref, plasma ΔTp / Tref, and full-cell cover qc / qref · raw values and units remain in each legend.'", "'Axial maxima divided by each declared display reference · raw SI quantities remain in the legends.'");
replace("setText('scene-details','Two actual axial sections · opaque material with display cutaway · drag to inspect; geometry remains fixed');", "setText('scene-details',$('presentation-shape').value==='wormhole'?'Mapped axial sections · visual throat; solved material geometry stays cylindrical':'Physical axial sections · solved cylinder and display cutaway');updatePulseEnergy();");
const energy=String.raw`function updatePulseEnergy(){
 const data=pulseDiagnostics(frame),e=data.energy,port=data.vacuumPort,shape=$('presentation-shape').value;
 setText('presentation-note',shape==='wormhole'?'Wormhole-style display mapping · cylindrical equations and energy ledger unchanged':'Solved cylindrical geometry · physical coordinates');
 const fluxRef=fmt(displayScales().fluxWPerM2,'W/m²');
 const channels=port.status==='ready'?'Vacuum sample z = '+fmt(port.planeZM,'m')+' · +z '+fmt(port.forwardCharacteristicPowerW,'W')+' / −z '+fmt(port.backwardCharacteristicPowerW,'W')+' · local channels, not a global reflection coefficient':'Vacuum channels unavailable · no qualifying source-tail-suppressed vacuum plane';
 setText('energy-path-summary','Net energy flow: cyan +z / pink −z · fixed |S| reference '+fluxRef+' · return flow includes reflections and reactive interference. '+channels);
 const rows=[['Source work (signed)',e.sourceWorkJ],['Field storage',e.fieldEnergyJ],['Reversible plasma drift',e.plasmaDriftEnergyJ],['Plasma thermal change',e.plasmaThermalEnergyJ],['Aggie thermal change',e.coverThermalEnergyJ],['Artificial sponge loss',e.spongeLossJ],['Ledger residual',e.balanceResidualJ]];
 const transfers=[['Plasma collision deposition',e.plasmaCollisionDepositedJ],['Aggie Ohmic deposition',e.coverOhmicDepositedJ],['Contact → cover (signed)',e.contactTransferToCoverJ]];
 const list=el('dl',undefined,'pulse-energy-values');for(const [name,value] of rows)list.append(el('dt',name),el('dd',fmt(value,'J',4)));
 const transfer=el('p',transfers.map(([name,value])=>name+': '+fmt(value,'J',4)).join(' · '));
 const power=el('p','Absorbed power now: plasma '+fmt(e.plasmaCollisionPowerW,'W')+' · aggie '+fmt(e.coverOhmicPowerW,'W')+' · accumulated deposition is already included in thermal accounting');
 $('pulse-energy-destinations').replaceChildren(list,transfer,power);
}
`;
replace('function updateLegend(layer){',energy+'\nfunction updateLegend(layer){');
new vm.Script(source);fs.writeFileSync(file,source);console.log('Pulse controls and energy display integrated.');
