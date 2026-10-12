"""Scientific mode-02 plate from the exact shared-complex 96×80 UI mesh.

The cylindrical mesh is rasterized without lighting. Triangle positions are
piecewise linear; vertex RGB uses perspective-correct barycentric interpolation.
This is a static data figure, not a browser screenshot or a 3D physical solver.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import textwrap

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import hsv_to_rgb
from matplotlib.patches import FancyBboxPatch
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'outputs'
OUT.mkdir(exist_ok=True)
DATA = ROOT / 'examples' / 'phase-cylinder-vertices.json'
SOURCE = ROOT / 'data' / 'phase-reference.json'
mesh_bytes = DATA.read_bytes()
mesh = json.loads(mesh_bytes.decode('utf-8-sig'))
frame = json.loads(SOURCE.read_text(encoding='utf-8-sig'))
sha = lambda b: hashlib.sha256(b).hexdigest()
assert mesh['source']['sha256'] == sha(SOURCE.read_bytes())
assert mesh['presentation']['sha256'] == sha((ROOT / 'public' / 'app.js').read_bytes())
verts = mesh['vertices']
triangles = np.array(mesh['triangles'], dtype=int)
# Original UI coordinates [X, axial h, Z] become mplot3d [X, Z, axial h].
pos = np.array([v['position'] for v in verts])[:, [0, 2, 1]]
rgb = np.array([v['color'] for v in verts])
assert len(verts) == 97 * 81 and len(triangles) == 96 * 80 * 2
assert np.isfinite(pos).all() and np.isfinite(rgb).all()
A = np.array([v['amplitude'] for v in verts])
assert np.max(abs(np.hypot(pos[:, 0], pos[:, 1]) - (1 + .2 * A))) < 1e-14

BG, PANEL, TEXT, MUTED, GRID, CYAN = '#08131d', '#0b1c29', '#e4eef5', '#9db5c5', '#294252', '#80d8e6'
plt.rcParams.update({'font.family':'DejaVu Sans', 'font.size':10,
    'text.color':TEXT, 'axes.labelcolor':MUTED, 'xtick.color':MUTED,
    'ytick.color':MUTED, 'axes.edgecolor':GRID, 'figure.facecolor':BG,
    'axes.facecolor':PANEL, 'savefig.facecolor':BG, 'axes.titlecolor':TEXT})
fig = plt.figure(figsize=(15,10), dpi=300)
fig.text(.045,.954,'GFM / CYLINDRICAL FIELD LABORATORY', fontsize=10, color=CYAN, weight='bold', ha='left')
fig.text(.045,.91,'COHERENT PHASE CYLINDER', fontsize=24, weight='bold')
fig.text(.045,.878,'MODE 02  /  A preserved 2D complex field wrapped onto a cylindrical presentation mesh', fontsize=11, color=MUTED)
fig.text(.955,.949,'DATA FIGURE  ·  DIMENSIONLESS DISPLAY',fontsize=9,color=MUTED,ha='right')
fig.text(.955,.921,f"Stored t* = {frame['time']:.3f}  |  {frame['grid']['nx']} × {frame['grid']['ny']} source cells",fontsize=11,color=TEXT,ha='right')

# Tall can-like reconstruction. The geometry retains the exact declared ratio.
ax = fig.add_axes([.018,.215,.492,.637], projection='3d')
ax.set_facecolor(BG)
ax.set_xlim(-1.4,1.4); ax.set_ylim(-1.4,1.4); ax.set_zlim(-2.65,2.65)
ax.set_box_aspect([2.8,2.8,5.3])
ax.view_init(elev=18, azim=-53)
ax.set_xlabel('')
ax.set_ylabel('')
ax.set_zlabel('Axial display h / Rref', labelpad=9, fontsize=9)
ax.set_xticks([]); ax.set_yticks([]); ax.set_zticks([-2.4,-1.2,0,1.2,2.4])
ax.tick_params(labelsize=8, pad=1)
for axis in [ax.xaxis,ax.yaxis,ax.zaxis]:
    axis.set_pane_color((.027,.072,.105,0))
    axis._axinfo['grid'].update({'color':GRID,'linewidth':.45})
    axis.line.set_color(GRID)
# The wire is a display-coordinate reference, not an additional physical field.
for h in [-2.4,0,2.4]:
    theta=np.linspace(0,2*np.pi,145)
    ax.plot(1.28*np.cos(theta),1.28*np.sin(theta),np.full_like(theta,h),color='#335d72',lw=.4,alpha=.7)
fig.text(.075,.837,'Transverse display X, Z ∈ [−1.4, +1.4] Rref · all coordinates dimensionless',fontsize=8.6,color=MUTED)
fig.text(.075,.241,'Geometry and unlit phase color share ψinterp at every mesh vertex.',fontsize=9,color=TEXT)
fig.text(.075,.223,'Open ends are display boundaries; this surface is not a physical material shell.',fontsize=8.5,color=MUTED)

# Original 32×32 source field, independently displayed with the same HSV mapping.
nx,ny=frame['grid']['nx'],frame['grid']['ny']
re=np.asarray(frame['fields']['psiRe']).reshape(ny,nx)
im=np.asarray(frame['fields']['psiIm']).reshape(ny,nx)
amp=np.hypot(re,im); phase=np.arctan2(im,re)
source_hsv=np.stack([((phase+np.pi)/(2*np.pi))%1,np.full_like(amp,.76),np.clip(amp,0,1)],axis=-1)
source_rgb=hsv_to_rgb(source_hsv)
source_rgb[amp<=1e-10]=[.067,.102,.145]
sourceax=fig.add_axes([.605,.625,.286,.227])
sourceax.imshow(source_rgb,origin='lower',extent=[0,2*np.pi,0,2*np.pi],interpolation='nearest',aspect='equal')
sourceax.set_xticks([0,np.pi,2*np.pi],['0','π','2π']);sourceax.set_yticks([0,np.pi,2*np.pi],['0','π','2π'])
sourceax.tick_params(labelsize=8)
sourceax.set_xlabel('x / L₀  →  azimuth θ',fontsize=9,labelpad=4)
sourceax.set_ylabel('y / L₀  →  axial display h',fontsize=9,labelpad=5)
sourceax.set_title('PRESERVED SOURCE FIELD',loc='left',fontsize=10,weight='bold',pad=11)
for defect in frame.get('defects',[]):
    x,y=defect['x'],defect['y']
    sourceax.scatter([x],[y],s=35,c='#142b39',edgecolors='#d4e7ee',linewidths=.7,zorder=5)
    sourceax.text(x,y,'+' if defect['charge']>0 else '−',ha='center',va='center',fontsize=7,color=TEXT,zorder=6)

legendax=fig.add_axes([.613,.544,.278,.015])
H=np.linspace(0,1,512)
legendrgb=hsv_to_rgb(np.stack([H%1,np.full_like(H,.76),np.ones_like(H)],axis=-1))
legendax.imshow(legendrgb[np.newaxis,:,:],extent=[-np.pi,np.pi,0,1],aspect='auto',interpolation='nearest')
legendax.set_yticks([]);legendax.set_xticks([-np.pi,0,np.pi],['−π','0','+π']);legendax.tick_params(labelsize=8,length=2)
fig.text(.613,.573,'Phase hue  ·  arg ψ [rad]  ·  cyclic endpoints',fontsize=9,color=TEXT)
fig.text(.613,.503,'Brightness V = clamp(|ψinterp|, 0, 1)  ·  saturation = 0.76',fontsize=8.5,color=MUTED)

# Numeric record distinguishes source numerical consistency from physical validation.
fig.text(.555,.480,'RECONSTRUCTION & NUMERICAL RECORD',fontsize=10,weight='bold',color=CYAN)
rows=[
    ('Presentation mesh',f"{mesh['presentation']['thetaSegments']} azimuth × {mesh['presentation']['heightSegments']} axial subdivisions"),
    ('Mesh size',f"{len(verts):,} vertices · {len(triangles):,} triangles"),
    ('Amplitude relief','R/Rref = 1 + 0.20 |ψinterp|'),
    ('Axial aspect','Href/Rref = 4.8 · h/Href = y/L − ½'),
    ('Source max amplitude',f"{amp.max():.8f}  [dimensionless]"),
    ('Source phase markers',f"{frame['diagnostics']['defectCount']} resolved · net charge {frame['diagnostics']['netWinding']}"),
    ('Periodic seam error',f"{mesh['validation']['seamPositionError']:.2e}  [display length]"),
    ('Radius identity error',f"{mesh['validation']['radiusError']:.2e}  [display length]"),
    ('Source mass / energy residual',f"{frame['diagnostics']['relativeMassError']:.2e}  /  {frame['diagnostics']['relativeEnergyError']:.2e}"),
    ('Source normalized ∇·B',f"{frame['diagnostics']['normalizedDivB']:.2e}"),
]
for k,(label,value) in enumerate(rows):
    y=.451-k*.0221
    fig.text(.555,y,label,fontsize=8.8,color=MUTED)
    fig.text(.946,y,value,fontsize=8.8,color=TEXT,ha='right')
fig.text(.555,.215,'Residuals indicate source numerical consistency, not empirical validation.',fontsize=8.3,color=MUTED)

# Three compact method panels.
for x,w in [(.045,.301),(.364,.284),(.667,.288)]:
    fig.add_artist(FancyBboxPatch((x,.070),w,.122,boxstyle='round,pad=0.006,rounding_size=0.004',transform=fig.transFigure,facecolor=PANEL,edgecolor=GRID,linewidth=.8,zorder=0))
fig.text(.059,.170,'01 / SHARED COMPLEX INTERPOLANT',fontsize=9,color=CYAN,weight='bold')
fig.text(.059,.141,r'$\psi_{\rm interp}=\mathcal{B}(\mathrm{Re}\,\psi)+i\,\mathcal{B}(\mathrm{Im}\,\psi)$',fontsize=13)
fig.text(.059,.110,'Periodic bilinear interpolation of the original complex',fontsize=8.7,color=MUTED)
fig.text(.059,.090,'components; wrapped phase angles are never interpolated.',fontsize=8.7,color=MUTED)
fig.text(.378,.170,'02 / PRESENTATION TRANSFER',fontsize=9,color=CYAN,weight='bold')
fig.text(.378,.142,r'$R=R_{\rm ref}(1+s|\psi_{\rm interp}|),\quad s=0.20$',fontsize=12)
fig.text(.378,.116,r'$\theta=2\pi x/L,\quad h=4.8R_{\rm ref}(y/L-1/2)$',fontsize=12)
fig.text(.378,.090,'Piecewise-linear geometry and vertex-RGB rasterization.',fontsize=8.5,color=MUTED)
fig.text(.681,.170,'03 / SCIENTIFIC SCOPE',fontsize=9,color=CYAN,weight='bold')
fig.text(.681,.143,'Stored 2D neutral Ginzburg–Landau phase field.',fontsize=9.4)
fig.text(.681,.120,'Display coordinates are dimensionless and independent',fontsize=8.7,color=MUTED)
fig.text(.681,.099,'of the separate SI pulse model. No 3D field evolution',fontsize=8.7,color=MUTED)
fig.text(.681,.080,'or black-hole interpretation is inferred from this shape.',fontsize=8.7,color=MUTED)
fig.text(.045,.045,'Source SHA-256  '+mesh['source']['sha256'],fontsize=6.8,color='#6f8fa2',family='DejaVu Sans Mono')
fig.text(.045,.030,'View SHA-256    '+mesh['presentation']['sha256'],fontsize=6.8,color='#6f8fa2',family='DejaVu Sans Mono')
fig.text(.045,.015,'Mesh SHA-256    '+sha(mesh_bytes),fontsize=6.8,color='#6f8fa2',family='DejaVu Sans Mono')
fig.text(.955,.037,'Calculated-data plate · static snapshot',fontsize=8,color=MUTED,ha='right')
fig.text(.955,.020,'Unlit mesh rendering · not a browser screenshot',fontsize=8,color=MUTED,ha='right')

# Rasterize the exact triangle mesh, with no lighting adjustment. This retains
# each UI vertex RGB and uses the same interpolation convention as a 3D raster.
fig.canvas.draw()
M=ax.get_proj()
clip=np.c_[pos,np.ones(len(pos))]@M.T
proj=clip[:,:3]/clip[:,3,None]
pixels=ax.transData.transform(proj[:,:2])
width,height=fig.canvas.get_width_height()
xmin=max(0,int(np.floor(pixels[:,0].min()))-1);xmax=min(width,int(np.ceil(pixels[:,0].max()))+1)
ymin=max(0,int(np.floor(pixels[:,1].min()))-1);ymax=min(height,int(np.ceil(pixels[:,1].max()))+1)
image=np.zeros((ymax-ymin,xmax-xmin,4),dtype=np.float32)
depth=np.full((ymax-ymin,xmax-xmin),np.inf,dtype=np.float64)
for ids in triangles:
    xy=pixels[ids];d=proj[ids,2];invw=1/clip[ids,3]
    lowx=max(xmin,int(np.floor(xy[:,0].min())));highx=min(xmax,int(np.ceil(xy[:,0].max()))+1)
    lowy=max(ymin,int(np.floor(xy[:,1].min())));highy=min(ymax,int(np.ceil(xy[:,1].max()))+1)
    if highx<=lowx or highy<=lowy:continue
    xx,yy=np.meshgrid(np.arange(lowx,highx)+.5,np.arange(lowy,highy)+.5)
    x0,y0=xy[0];x1,y1=xy[1];x2,y2=xy[2]
    den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
    if abs(den)<1e-15:continue
    a=((y1-y2)*(xx-x2)+(x2-x1)*(yy-y2))/den
    b=((y2-y0)*(xx-x2)+(x0-x2)*(yy-y2))/den
    c=1-a-b
    inside=(a>=-1e-10)&(b>=-1e-10)&(c>=-1e-10)
    z=a*d[0]+b*d[1]+c*d[2]
    sl=(slice(lowy-ymin,highy-ymin),slice(lowx-xmin,highx-xmin))
    mask=inside&(z<depth[sl])
    if not mask.any():continue
    weights=np.stack([a*invw[0],b*invw[1],c*invw[2]],axis=-1)
    weights/=weights.sum(axis=-1,keepdims=True)
    color=weights@rgb[ids]
    depth[sl][mask]=z[mask]
    image[sl][:,:,:3][mask]=color[mask]
    image[sl][:,:,3][mask]=1
fig.figimage(image,xo=xmin,yo=ymin,origin='lower',zorder=5)
full=OUT/'GFM-Phase-Cylinder.png'
fig.savefig(full,dpi=300,facecolor=BG)
plt.close(fig)
with Image.open(full) as im:
    im.thumbnail((1800,1200),Image.Resampling.LANCZOS)
    im.save(OUT/'GFM-Phase-Cylinder-preview.png',optimize=True)
print(json.dumps({'full':str(full),'preview':str(OUT/'GFM-Phase-Cylinder-preview.png'),
 'meshVertices':len(verts),'triangles':len(triangles),'unlitPerspectiveCorrectRGB':True,
 'sourceSHA256':mesh['source']['sha256'],'meshSHA256':sha(mesh_bytes)}))
