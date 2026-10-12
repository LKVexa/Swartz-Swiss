"""Deterministic scientific plates and GIF from exported computed snapshots.

No field motion, pulse location or material temperature is invented here.
The display height is L-z (mouth upward); all labels retain physical z.
Color uses a fixed SI electric reference F0*tau/epsilon0 for every frame.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import colors
from matplotlib.backends.backend_pdf import PdfPages
import numpy as np
from PIL import Image

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / "examples" / "sequence.json"
OUT = PROJECT / "outputs"
OUT.mkdir(exist_ok=True)
sequence = json.loads(SOURCE.read_text(encoding="utf-8-sig"))
frames = sequence["frames"]
assert len(frames) > 1
p = frames[0]["parameters"]
eps = frames[0]["constants"]["epsilon0FPerM"]
mu = frames[0]["constants"]["mu0HPerM"]
E_REF = p["sourceCurrentAmplitudeAPerM2"] * p["pulseWidthSeconds"] / eps
H_REF = E_REF / np.sqrt(mu / eps)
assert E_REF > 0
nr, nz = frames[0]["grid"]["nr"], frames[0]["grid"]["nz"]
R, L = p["radiusM"], p["lengthM"]
RC, RI = p["cylinderRadiusM"], p["cylinderRadiusM"] - p["wallThicknessM"]
Z_START, Z_END = p["cylinderStartM"], p["cylinderStartM"] + p["cylinderLengthM"]
R_EDGES = np.linspace(0, R, nr + 1)
Z_EDGES = np.linspace(0, L, nz + 1)
R_CENTERS = np.asarray(frames[0]["grid"]["rM"])
Z_CENTERS = np.asarray(frames[0]["grid"]["zM"])
VOLUME = np.asarray(frames[0]["grid"]["cellVolumesM3"]).reshape(nz, nr)
CAVITY = (R_CENTERS[None, :] < RI) & (Z_CENTERS[:, None] >= Z_START + p["bottomThicknessM"]) & (Z_CENTERS[:, None] < Z_END - p["bottomThicknessM"])
for f in frames:
    assert f["grid"]["nr"] == nr and f["grid"]["nz"] == nz
    assert f["parameters"] == p
    assert len(f["fields"]["EphiVPerM"]) == nr * nz
    assert np.isfinite(f["fields"]["EphiVPerM"]).all()
assert all(b["timeSeconds"] > a["timeSeconds"] for a, b in zip(frames, frames[1:]))

palette = colors.LinearSegmentedColormap.from_list("signed_electric", [
    (0.0, "#175c99"), (.25, "#1885b4"), (.425, "#43b8d2"),
    (.5, "#0b2434"), (.575, "#d6bc76"), (.75, "#ee9955"), (1.0, "#d54a42"),
])
norm = colors.Normalize(vmin=-E_REF, vmax=E_REF)
BG, PANEL, TEXT, MUTED, GRID = "#08131d", "#0b1c29", "#e4eef5", "#9db5c5", "#294252"
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 9,
    "text.color": TEXT, "axes.labelcolor": MUTED, "xtick.color": MUTED,
    "ytick.color": MUTED, "axes.edgecolor": GRID,
    "figure.facecolor": BG, "axes.facecolor": PANEL,
    "savefig.facecolor": BG, "axes.titlecolor": TEXT,
    "pdf.fonttype": 42, "ps.fonttype": 42,
})


def electric(f):
    return np.asarray(f["fields"]["EphiVPerM"]).reshape(nz, nr)


def surface(ax, X, Y, Z, color, alpha=1):
    return ax.plot_surface(X * 1000, Y * 1000, Z * 1000,
                           color=color, alpha=alpha, linewidth=0,
                           antialiased=False, shade=False, rstride=1, cstride=1,
                           rasterized=True)


def annulus(ax, rin, rout, zphysical, color, phi=None, alpha=1):
    if rout <= rin:
        return
    phi = np.linspace(0, 2 * np.pi, 75) if phi is None else phi
    rr, aa = np.meshgrid([rin, rout], phi)
    surface(ax, rr * np.cos(aa), rr * np.sin(aa), np.full_like(rr, L-zphysical), color, alpha)


def draw_geometry(ax, f):
    # The excluded 90-degree sector is a documented visualization cutaway.
    phi = np.deg2rad(np.linspace(-10, 260, 76))
    zz, aa = np.meshgrid([Z_START, Z_END], phi)
    for radius, color in [(RC, "#7d8b93"), (RI, "#b1b9bd")]:
        surface(ax, radius * np.cos(aa), radius * np.sin(aa), L-zz, color, .72)
    annulus(ax, RI, RC, Z_START, "#b8c6cc", phi, .95)
    annulus(ax, 0, RC, Z_END, "#637680", phi, .85)
    annulus(ax, 0, RI, Z_END-p["bottomThicknessM"], "#879aa3", phi, .72)
    opening = RI * np.sqrt(1-p["coverFraction"])
    if p["coverFraction"] > 0:
        annulus(ax, opening, RI, Z_START, "#a8b8bf", phi, .90)
    # Cutaway edge outlines correspond to actual inner and outer material radii.
    for angle in [phi[0], phi[-1]]:
        for radius in [RI, RC]:
            ax.plot([radius*np.cos(angle)*1000]*2, [radius*np.sin(angle)*1000]*2,
                    [(L-Z_START)*1000, (L-Z_END)*1000], color="#d5e1e5", lw=.7, alpha=.9)


def draw_fields(ax, f):
    E = electric(f)
    # Exact annular samples are mirrored as cylindrical E_phi scalars. The
    # cylindrical vector basis, rather than this scalar, changes with phi.
    ir = int(np.ceil(RI / frames[0]["grid"]["drM"]))
    ka = int(np.floor(Z_START / frames[0]["grid"]["dzM"]))
    kb = int(np.ceil((Z_END-p['bottomThicknessM']) / frames[0]["grid"]["dzM"]))
    radial_edges = R_EDGES[:ir+1].copy()
    radial_edges[-1] = RI
    axial_edges = Z_EDGES[ka:kb+1].copy()
    axial_edges[0] = Z_START; axial_edges[-1] = Z_END-p['bottomThicknessM']
    signed_edges = np.r_[-radial_edges[:0:-1], radial_edges]
    E_mirror = np.c_[E[ka:kb, :ir][:, ::-1], E[ka:kb, :ir]]
    rr, zz = np.meshgrid(signed_edges, axial_edges)
    theta = np.deg2rad(35)  # slice normal faces the -55-degree camera
    rgba = palette(norm(E_mirror))
    rgba[..., 3] = .93
    ax.plot_surface(rr*np.cos(theta)*1000, rr*np.sin(theta)*1000, (L-zz)*1000,
                    facecolors=rgba, linewidth=0, antialiased=False, shade=False,
                    rstride=1, cstride=1, rasterized=True)

    # Fixed physical axial sample planes. Their face colors use actual samples;
    # only opacity depends on amplitude, with one fixed reference for the movie.
    phi = np.linspace(0, 2*np.pi, 33)
    for desired in [p["sourceCenterZM"], Z_START, Z_START+.035, Z_START+.08, Z_END-.015]:
        k = int(np.argmin(abs(Z_CENTERS-desired)))
        aa, rr = np.meshgrid(phi, R_EDGES)
        data = np.repeat(E[k, :, None], len(phi)-1, axis=1)
        fc = palette(norm(data))
        fc[..., 3] = np.minimum(.8, 2.5*abs(data)/E_REF)
        ax.plot_surface(rr*np.cos(aa)*1000, rr*np.sin(aa)*1000,
                        np.full_like(rr, (L-Z_CENTERS[k])*1000), facecolors=fc,
                        linewidth=0, antialiased=False, shade=False, rstride=1, cstride=1,
                        rasterized=True)

    # Cell-centred magnetic averages are a display field. Energy calculations
    # continue to use raw staggered field samples and dual volumes.
    Hr = np.asarray(f["fields"]["HrAPerM"]).reshape(nz, nr)
    Hz = np.asarray(f["fields"]["HzAPerM"]).reshape(nz, nr)
    coords, vectors = [], []
    for k in range(2, nz, 6):
        for i in range(2, nr, 7):
            br, bz = Hr[k, i], Hz[k, i]
            if np.hypot(br, bz)/H_REF < .035:
                continue
            r, z = R_CENTERS[i], Z_CENTERS[k]
            coords.append([r*np.cos(theta)*1000, r*np.sin(theta)*1000, (L-z)*1000])
            # The axial vector flips in the chosen height=L-z display mapping.
            vectors.append([br*np.cos(theta)/H_REF*16, br*np.sin(theta)/H_REF*16, -bz/H_REF*16])
    if coords:
        coords, vectors = np.array(coords).T, np.array(vectors).T
        ax.quiver(*coords, *vectors, normalize=False, color="#fff9d9", linewidth=.7,
                  arrow_length_ratio=.30)


def figure_for(index, animation=False):
    f = frames[index]
    fig = plt.figure(figsize=(12, 8))
    fig.text(.055, .960, "GFM  /  CYLINDRICAL PULSE LABORATORY", size=15, weight="bold")
    fig.text(.055, .926, "Calculated pulse transport into a hollow Ohmic cylinder · axisymmetric Maxwell reconstruction", size=10, color=MUTED)
    fig.text(.95, .962, f"t = {f['timeSeconds']*1e9:.3f} ns", size=14, weight="bold", ha="right", color="#87d6e5")

    ax = fig.add_axes([.025, .280, .51, .605], projection="3d")
    ax.set_facecolor(BG)
    draw_fields(ax, f)
    draw_geometry(ax, f)
    ax.set_xlim(-R*1000, R*1000)
    ax.set_ylim(-R*1000, R*1000)
    ax.set_zlim(0, L*1000)
    ax.set_box_aspect([2*R, 2*R, L])
    ax.view_init(elev=19, azim=-55)
    ax.set_xlabel("")
    ax.set_ylabel("")
    ax.set_zlabel("Axial coordinate z [mm]", labelpad=9)
    zphysical_ticks = np.array([0, .08, .16, .24, .32])
    ax.set_zticks((L-zphysical_ticks)*1000, [f"{v*1000:.0f}" for v in zphysical_ticks])
    # Transverse units and limits are declared above the panel; projected
    # floor ticks otherwise collide with geometry metadata outside 3D axes.
    ax.set_xticks([]); ax.set_yticks([])
    ax.tick_params(labelsize=7, pad=0)
    for axis in [ax.xaxis, ax.yaxis, ax.zaxis]:
        axis.pane.set_facecolor((.04,.10,.14,.12))
        axis.pane.set_edgecolor(GRID)
        axis._axinfo["grid"]["color"] = colors.to_rgba(GRID, .4)
    ax.text2D(.07, .99, "01  THREE-DIMENSIONAL FIELD RECONSTRUCTION", transform=ax.transAxes, size=9, weight="bold")
    ax.text2D(.07, .95, "90° wall cutaway · X, Y ∈ [−60, 60] mm · arrows = computed H\nDisplay height = L − z; physical axial labels retained", transform=ax.transAxes,
              size=7.3, color=MUTED, va="top",
              bbox={"facecolor":BG,"edgecolor":"none","alpha":.92,"pad":2})
    # Material labels are structural geometry, not glowing optical emission.
    fig.text(.053, .241, f"Hollow target  Ø{2*RC*1000:.0f} × {p['cylinderLengthM']*1000:.0f} mm   |   wall {p['wallThicknessM']*1000:.0f} mm   |   σ = {p['sigmaSPerM']:.3g} S/m", size=8.5)

    field_ax = fig.add_axes([.555, .485, .31, .38])
    mesh = field_ax.pcolormesh(R_EDGES*1000, Z_EDGES*1000, electric(f), cmap=palette, norm=norm,
                              shading="flat", rasterized=True)
    field_ax.set_ylim(L*1000, 0)
    field_ax.set_title("02  EXACT r–z ELECTRIC SAMPLES", loc="left", size=9, weight="bold", pad=10)
    field_ax.set_xlabel("Radius r [mm]", labelpad=3)
    field_ax.set_ylabel("Physical z [mm]")
    field_ax.set_xticks([0, 20, 40, 60])
    field_ax.plot([RI*1000]*2, [Z_START*1000, (Z_END-p['bottomThicknessM'])*1000], color="#e4edf2", lw=1.1)
    field_ax.plot([RC*1000]*2, [Z_START*1000, Z_END*1000], color="#e4edf2", lw=1.1)
    field_ax.plot([0, RC*1000], [Z_END*1000]*2, color="#e4edf2", lw=1.1)
    field_ax.plot([0, RI*1000], [(Z_END-p['bottomThicknessM'])*1000]*2, color="#e4edf2", lw=1.1)
    field_ax.axhline(p['sourceCenterZM']*1000, color="#6f767d", ls=":", lw=.7)
    field_ax.text(2, p['sourceCenterZM']*1000-6, "Imposed ring-current source", size=6.8, color=TEXT,
                  bbox={"facecolor":PANEL,"alpha":.8,"edgecolor":"none","pad":1.5})
    if p['coverFraction']:
        opening = RI*np.sqrt(1-p['coverFraction'])*1000
        field_ax.plot([opening, RI*1000], [Z_START*1000]*2, color="#343c43", lw=2)
    cax = fig.add_axes([.885, .485, .012, .38])
    cb = fig.colorbar(mesh, cax=cax, ticks=[-E_REF, -E_REF/2, 0, E_REF/2, E_REF])
    cb.ax.set_yticklabels([f"{x:.0f}" for x in [-E_REF, -E_REF/2, 0, E_REF/2, E_REF]])
    cb.ax.tick_params(labelsize=7)
    cb.set_label("Azimuthal electric field Eφ [V/m]", size=8)

    hist = fig.add_axes([.555, .270, .365, .14])
    times = np.array([q['timeSeconds']*1e9 for q in frames])
    for key, label, color in [('sourceWorkJ', 'Signed source work', '#80d7e6'),
                              ('fieldEnergyJ', 'Stored EM energy', '#c8e9ae'),
                              ('materialHeatJ', 'Material Joule heat', '#f4b56b'),
                              ('spongeLossJ', 'Artificial sponge loss', '#b2a2db')]:
        values = [q['diagnostics'][key]*1e12 for q in frames]
        hist.plot(times[:index+1], values[:index+1], color=color, lw=1.6, label=label)
    hist.set_xlim(times[0], times[-1]); hist.set_ylim(-1, 1.08*max(q['diagnostics']['sourceWorkJ']*1e12 for q in frames))
    hist.set_title("03  COMPUTED ENERGY BALANCE", loc="left", size=9, weight="bold", pad=8)
    hist.set_xlabel("Physical time [ns]", labelpad=2); hist.set_ylabel("Energy [pJ]")
    hist.grid(color=GRID, alpha=.6, lw=.5)
    hist.tick_params(labelsize=7)
    hist.legend(loc="upper left", fontsize=6.5, ncol=2, frameon=False, labelcolor=TEXT,
                handlelength=1.7, columnspacing=1)

    d = f['diagnostics']
    fig.text(.055, .199, "FIELD / MATERIAL RECORD", size=9, weight="bold", color="#87d6e5")
    record = (f"Eφ,max  {d['maxEphiVPerM']:.3f} V/m     |     Bmax  {d['maxBTesla']*1e9:.3f} nT     |     deposited heat  {d['materialHeatJ']*1e12:.4f} pJ\n"
              f"Peak matter ΔT  {d['maxTemperatureRiseK']:.3e} K     |     relative energy residual  {d['relativeEnergyBalanceResidual']:.2e}\n"
              f"Grid  {nr} × {nz} annular cells     |     Δr = {frames[0]['grid']['drM']*1000:.3f} mm     Δz = {frames[0]['grid']['dzM']*1000:.3f} mm     |     cover  {100*p['coverFraction']:.0f}%")
    fig.text(.055, .178, record, size=8.0, linespacing=1.65, va="top")
    fig.text(.555, .199, "EQUATIONS / DISPLAY REFERENCE", size=9, weight="bold", color="#87d6e5")
    eqs = ("ε ∂t Eφ = ∂z Hr − ∂r Hz − σEφ + Fφ\n"
           "μ ∂t Hr = ∂z Eφ      μ ∂t Hz = −r⁻¹∂r(rEφ)\n"
           f"Fixed color scale: ±Eref = ±F₀τ / ε₀ = ±{E_REF:.1f} V/m")
    fig.text(.555, .178, eqs, size=8.0, linespacing=1.65, va="top")
    fig.text(.055, .061, "Calculated m=0 electromagnetic fields; the displayed volume is a rotational reconstruction of the r–z grid.\n"
             "Field colors are quantitative false color, without lighting. Gray surfaces indicate material geometry; color is not thermal emission.\n"
             "PEC boundaries + electric sponge; constant vacuum ε, μ and generic Ohmic matter. No fluid, plasma dispersion or gravity evolution.",
             size=7.2, color=MUTED, linespacing=1.5)
    fig.text(.945, .027, f"COMPUTED SNAPSHOT {index:02d}/{len(frames)-1:02d} · ENGINE {sequence['engineSHA256'][:12]}", size=6.7, color=MUTED, ha="right")
    return fig


def main():
    # Choose a data-derived representative frame, not an ornamental pulse time.
    cavity_electric_energies = [float(np.sum(.5*eps*electric(f)**2*VOLUME*CAVITY)) for f in frames]
    representative = int(np.argmax(cavity_electric_energies))
    fig = figure_for(representative)
    fig.savefig(OUT / "GFM-Computed-Cylinder.png", dpi=250)
    fig.savefig(OUT / "GFM-Computed-Cylinder-preview.png", dpi=125)
    with PdfPages(OUT / "GFM-Computed-Cylinder.pdf", metadata={"Title":"GFM computed cylindrical pulse reconstruction", "Author":"GFM scientific rendering", "Subject":"Axisymmetric Maxwell–Ohmic calculated fields"}) as pdf:
        pdf.savefig(fig)
        final = figure_for(len(frames)-1)
        pdf.savefig(final)
        plt.close(final)
    plt.close(fig)

    gif_frames = []
    for j in range(len(frames)):
        figure = figure_for(j, animation=True)
        figure.set_dpi(80)
        figure.canvas.draw()
        rgba = np.asarray(figure.canvas.buffer_rgba()).copy()
        gif_frames.append(Image.fromarray(rgba).convert("RGB"))
        plt.close(figure)
    # A single palette prevents artificial color flashing during playback.
    palette_reference = gif_frames[representative].quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    indexed = [f.quantize(palette=palette_reference, dither=Image.Dither.NONE) for f in gif_frames]
    indexed[0].save(OUT / "GFM-Computed-Cylinder.gif", save_all=True,
                    append_images=indexed[1:], duration=110, loop=0, disposal=2, optimize=False)
    audit = {
        "source": str(SOURCE), "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "engineSha256": sequence['engineSHA256'], "frames": len(frames),
        "representativeFrameIndex": representative, "representativeTimeSeconds": frames[representative]['timeSeconds'],
        "selectionRule": "maximum electric energy in the empty cavity among exported frames",
        "electricReferenceVPerM": E_REF, "colorNormalization": "linear fixed ±F0*tau/epsilon0 for all frames",
        "surfaceCellValues": "Ephi cell values replicated in azimuth; no invented pulse trajectories",
        "geometry": "hollow shell plus physical bottom and optional annular cover;90degree visualization cutaway",
        "displayTransform": "X=r*cos(phi),Y=r*sin(phi),height=L-z, with original physical z labels; axial vectors transformed consistently",
        "energyBasis": "exported staggered-field engine ledger, not the cell-centred visualization averages",
        "thermalBasis": "exported material temperature rise in kelvin; no exaggerated thermal emission",
        "claim": "scientific rendering of computed axisymmetric Maxwell–Ohmic data; no arbitrary-3D, experimental, astronomical or material-specific validation",
        "artifacts": []
    }
    for name in ["GFM-Computed-Cylinder.png", "GFM-Computed-Cylinder-preview.png", "GFM-Computed-Cylinder.gif", "GFM-Computed-Cylinder.pdf"]:
        path = OUT / name
        audit['artifacts'].append({"path":name,"bytes":path.stat().st_size,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()})
    (PROJECT / "validation" / "computed-rendering.json").write_text(json.dumps(audit, indent=2), encoding="utf-8")
    print(json.dumps({"representativeFrame":representative,"timeNs":frames[representative]['timeSeconds']*1e9,"electricReferenceVPerM":E_REF,"artifacts":audit['artifacts']},indent=2))


if __name__ == "__main__":
    main()
