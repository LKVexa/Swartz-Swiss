"""Scientific plate from actual v2 exported fields; no invented trajectories."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import hsv_to_rgb
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
seq=json.loads((ROOT/'examples/audited-sequence.json').read_text())
frames=seq['frames']
# Select by the measured wave envelope inside the declared cavity.
def cavity_score(f):
    g,p=f['grid'],f['parameters']
    z,r=np.meshgrid(g['zM'],g['rM'],indexing='ij')
    inside=(r<p['cylinderRadiusM']-p['wallThicknessM'])&(z>p['cylinderStartM'])&(z<p['cylinderStartM']+p['cylinderLengthM'])
    return np.sum(np.array(f['fields']['envelopeAmplitudeVPerM']).reshape(g['nz'],g['nr'])**2*inside)
f=max(frames,key=cavity_score)
g,p,d=f['grid'],f['parameters'],f['diagnostics']
nz,nr=g['nz'],g['nr']
field=lambda key:np.asarray(f['fields'][key]).reshape(nz,nr)
amplitude=field('envelopeAmplitudeVPerM')
phase=np.asarray(f['fields']['relativeCarrierPhaseRad'],dtype=float).reshape(nz,nr)
valid=field('carrierPhaseValidMask').astype(bool)
scale=f['phaseAnalysis']['fixedAmplitudeScaleVPerM']
z=np.array(g['zM']);r=np.array(g['rM'])
plt.rcParams.update({'font.size':9,'figure.facecolor':'#081520','axes.facecolor':'#102332','text.color':'#dce7ee','axes.labelcolor':'#dce7ee','xtick.color':'#a7c3d2','ytick.color':'#a7c3d2'})
fig=plt.figure(figsize=(15,9))
fig.suptitle('GFM / AUDITED LOCAL PULSE–PLASMA–COVER MODEL',fontsize=19,x=.05,ha='left',y=.98)
fig.text(.05,.936,'m = 0 rotational reconstruction · fixed geometry · sampled electric carrier phase · distinct material response',color='#a7c3d2')
ax=fig.add_subplot(121,projection='3d')
theta=np.linspace(0,2*np.pi,49)
# Actual r-z cell samples swept around the symmetry axis; sparse display slices.
for k in range(0,nz,4):
    if np.max(amplitude[k])<f['phaseAnalysis']['amplitudeFloorVPerM']:continue
    rr,tt=np.meshgrid(r,theta)
    hsv=np.zeros((*rr.shape,3));hsv[:,:,0]=np.broadcast_to(np.nan_to_num((phase[k]+np.pi)/(2*np.pi)),rr.shape)
    hsv[:,:,1]=.8;hsv[:,:,2]=np.broadcast_to(np.clip(amplitude[k]/scale,0,1),rr.shape)
    colors=hsv_to_rgb(hsv);colors[:,~valid[k],:]=[.05,.08,.12]
    rgba=np.concatenate([colors,np.full((*rr.shape,1),.40)],axis=2)
    ax.plot_surface(1000*rr*np.cos(tt),1000*rr*np.sin(tt),np.full_like(rr,1000*(p['lengthM']-z[k])),facecolors=rgba,shade=False,linewidth=0,antialiased=False)
# Cutaway shell and a true geometric mouth: amplitude does not deform it.
phi=np.linspace(.65,5.3,60)
zz,tt=np.meshgrid([p['cylinderStartM'],p['cylinderStartM']+p['cylinderLengthM']],phi)
for radius in [p['cylinderRadiusM'],p['cylinderRadiusM']-p['wallThicknessM']]:
    ax.plot_surface(radius*1000*np.cos(tt),radius*1000*np.sin(tt),1000*(p['lengthM']-zz),color='#6c8492',alpha=.3,shade=False)
ax.set(xlabel='x / mm',ylabel='y / mm',zlabel='Display height L − z / mm',title='Wave layer: phase hue / fixed amplitude brightness')
ax.set_box_aspect((1,1,2.6));ax.view_init(18,35)
ax.set_xlim(-p['radiusM']*1000,p['radiusM']*1000);ax.set_ylim(-p['radiusM']*1000,p['radiusM']*1000)
ax.set_zlim(0,p['lengthM']*1000)
for axis in [ax.xaxis,ax.yaxis,ax.zaxis]:
    axis.pane.set_facecolor((.05,.10,.14,.35))
    axis.pane.set_edgecolor((.18,.29,.35,.4))

ax2=fig.add_subplot(222)
plasma=field('plasmaHeatCapacityJPerM3K')>0
image=ax2.pcolormesh(r*1000,z*1000,np.ma.array(field('plasmaTemperatureRiseK'),mask=~plasma),shading='nearest',cmap='inferno')
cb=fig.colorbar(image,ax=ax2,pad=.02);cb.set_label('Calculated ΔTp / K')
ax2.set(xlabel='r / mm',ylabel='physical z / mm',title='Plasma thermal response / masked outside plasma')
ax3=fig.add_subplot(224)
t=np.array([a['timeSeconds'] for a in frames])*1e9
for name,label in [('sourceWorkJ','Signed source work'),('fieldEnergyJ','Field storage'),('plasmaDriftEnergyJ','Electron drift storage'),('plasmaThermalEnergyJ','Plasma thermal increment'),('coverThermalEnergyJ','Cover enthalpy increment'),('spongeLossJ','Artificial sponge loss')]:
    ax3.plot(t,[a['diagnostics'][name]*1e12 for a in frames],label=label,lw=1.25)
ax3.set(xlabel='Physical time / ns',ylabel='Energy / pJ',title='Conservative ledger / thermal increments counted once')
ax3.legend(fontsize=7,ncol=2);ax3.grid(alpha=.12)
fig.subplots_adjust(left=.04,right=.95,bottom=.20,top=.87,wspace=.3,hspace=.35)
bar_ax=fig.add_axes([.09,.125,.28,.012])
bar=fig.colorbar(matplotlib.cm.ScalarMappable(norm=matplotlib.colors.Normalize(-np.pi,np.pi),cmap='hsv'),cax=bar_ax,orientation='horizontal',ticks=[-np.pi,0,np.pi])
bar.ax.set_xticklabels(['−π','0','+π'])
bar.ax.tick_params(labelsize=7)
bar.set_label('Relative phase hue at full brightness / rad',fontsize=7,labelpad=0)
analysis=f['phaseAnalysis']
caption=(f"Snapshot: {f['timeSeconds']*1e9:.3f} ns · phase window center: {analysis['analysisTimeSeconds']*1e9:.3f} ns · carrier: {p['pulseFrequencyHz']/1e9:.2f} GHz · amplitude scale: {scale:g} V/m\n"
         f"Upstream total-field reference (includes reflections); phase floor {analysis['amplitudeFloorVPerM']:g} V/m; {analysis['windowCycles']} carrier-cycle Hann history; masked phase cells are dark.\n"
         f"Relative energy-ledger residual: {d['relativeEnergyBalanceResidual']:.3e}. Synthetic constitutive parameters; local EM study, not an observationally validated spacetime.")
fig.text(.05,.04,caption,fontsize=8,color='#a7c3d2',linespacing=1.6)
out=ROOT/'outputs/GFM-Audited-Model.png'
fig.savefig(out,dpi=160)
plt.close(fig)
print(json.dumps({'path':str(out),'snapshotTimeSeconds':f['timeSeconds'],'phaseAnalysisTimeSeconds':analysis['analysisTimeSeconds'],'residual':d['relativeEnergyBalanceResidual']}))
