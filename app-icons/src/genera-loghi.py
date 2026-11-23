#!/usr/bin/env python3
"""Genera i 10 concept di icona app di SNAKEcheck (app-icons/logo-01.svg ... logo-10.svg).

Ogni SVG ha viewBox 0 0 512 512, sfondo a tutta superficie (così le maschere
rotonde / squircle / cerchio lo ritagliano bene) e il simbolo dentro la zona
sicura delle icone "maskable": cerchio di raggio ~205 px centrato su 256,256.

Uso:  python3 app-icons/src/genera-loghi.py
"""
import math
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# Palette presa dal tema "Giungla" dell'app (index.html, blocco 12) + colori Amel di Pepe
P = {
    "notte": "#0d1f17",     # --canvas scuro
    "bosco": "#16302a",     # --card scuro
    "muschio": "#24453a",   # --elev-2 scuro
    "foglia": "#9be15d",    # --ok / accento "Foglia"
    "lampada": "#ffb347",   # --lamp
    "amel": "#ff8a3d",      # corpo arancio Amel
    "corallo": "#f2603a",   # arancio-rosso
    "sella": "#d9372b",     # selle rosse
    "crema": "#fff1df",     # contorni chiari delle selle
    "inchiostro": "#10261b",  # --text chiaro
    "carta": "#f4efe4",
    "acqua": "#7dd3fc",
    "occhio": "#b3192e",    # occhi rosso rubino degli Amel
}


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def pts_path(points, close=False):
    d = "M " + " L ".join(f"{f(x)} {f(y)}" for x, y in points)
    return d + (" Z" if close else "")


def smooth_path(points):
    """Catmull-Rom -> cubiche di Bezier, per curve morbide che passano dai punti."""
    d = f"M {f(points[0][0])} {f(points[0][1])}"
    for i in range(len(points) - 1):
        p0 = points[i - 1] if i > 0 else points[i]
        p1, p2 = points[i], points[i + 1]
        p3 = points[i + 2] if i + 2 < len(points) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    return d


def svg(num, nome, defs, body):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-labelledby="t{num}">
  <title id="t{num}">SNAKEcheck · Logo #{num} · {nome}</title>
  <defs>
{defs}
  </defs>
{body}
</svg>
"""


loghi = {}

# ---------------------------------------------------------------- #01 Spira
loghi["01"] = svg("01", "Spira", f"""    <radialGradient id="g01bg" cx="35%" cy="25%" r="85%">
      <stop offset="0" stop-color="{P['muschio']}"/>
      <stop offset="1" stop-color="{P['notte']}"/>
    </radialGradient>
    <linearGradient id="g01corpo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{P['lampada']}"/>
      <stop offset="1" stop-color="{P['corallo']}"/>
    </linearGradient>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g01bg)"/></g>
  <g id="simbolo" fill="none" stroke-linecap="round">
    <path d="M 320 186 A 64 64 0 1 0 256 250 A 64 64 0 1 1 192 314" stroke="url(#g01corpo)" stroke-width="68" transform="translate(0 6)"/>
    <circle cx="334" cy="176" r="11" fill="{P['notte']}" stroke="none"/>
  </g>""")

# ---------------------------------------------------------------- #02 Monogramma S + check
loghi["02"] = svg("02", "Monogramma S✓", f"""    <linearGradient id="g02bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{P['bosco']}"/>
      <stop offset="1" stop-color="{P['notte']}"/>
    </linearGradient>
    <linearGradient id="g02s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{P['lampada']}"/>
      <stop offset=".55" stop-color="{P['amel']}"/>
      <stop offset="1" stop-color="{P['corallo']}"/>
    </linearGradient>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g02bg)"/></g>
  <g id="lettera-s" fill="none" stroke="url(#g02s)" stroke-width="62" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 340 146 H 214 A 56 56 0 0 0 214 258 H 290 A 56 56 0 0 1 290 370 H 164"/>
  </g>
  <circle cx="334" cy="140" r="10" fill="{P['notte']}"/>
  <g id="badge-check">
    <circle cx="352" cy="352" r="66" fill="{P['foglia']}" stroke="{P['notte']}" stroke-width="18"/>
    <path d="M 322 354 L 343 375 L 384 332" fill="none" stroke="{P['notte']}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  </g>""")

# ---------------------------------------------------------------- #03 Terrario
onda = [(156, 334), (190, 316), (226, 334), (262, 318), (298, 334), (326, 322)]
loghi["03"] = svg("03", "Terrario", f"""    <linearGradient id="g03bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{P['bosco']}"/>
      <stop offset="1" stop-color="{P['notte']}"/>
    </linearGradient>
    <linearGradient id="g03vetro" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f5148"/>
      <stop offset=".7" stop-color="#2c4a33"/>
      <stop offset="1" stop-color="#4a3a22"/>
    </linearGradient>
    <radialGradient id="g03luce" cx="70%" cy="0%" r="70%">
      <stop offset="0" stop-color="{P['lampada']}" stop-opacity=".75"/>
      <stop offset="1" stop-color="{P['lampada']}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="g03clip"><rect x="112" y="170" width="288" height="226" rx="34"/></clipPath>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g03bg)"/></g>
  <g id="vasca">
    <rect x="112" y="170" width="288" height="226" rx="34" fill="url(#g03vetro)"/>
    <g clip-path="url(#g03clip)">
      <rect x="112" y="170" width="288" height="226" fill="url(#g03luce)"/>
      <rect x="112" y="342" width="288" height="60" fill="#6b4a2b"/>
      <path d="M 150 350 C 150 290 176 250 196 236 C 186 280 182 318 176 350 Z" fill="{P['foglia']}"/>
      <path d="M 176 350 C 190 300 218 280 236 276 C 222 302 206 330 200 350 Z" fill="#6fbf3c"/>
      <path d="{smooth_path(onda)}" fill="none" stroke="{P['amel']}" stroke-width="26" stroke-linecap="round"/>
      <ellipse cx="338" cy="318" rx="22" ry="16" fill="{P['amel']}"/>
      <circle cx="344" cy="313" r="4.5" fill="{P['occhio']}"/>
    </g>
    <rect x="112" y="170" width="288" height="226" rx="34" fill="none" stroke="{P['crema']}" stroke-opacity=".9" stroke-width="16"/>
  </g>
  <g id="lampada">
    <rect x="276" y="118" width="12" height="40" rx="6" fill="#8aa596"/>
    <path d="M 238 182 A 44 30 0 0 1 326 182 Z" fill="#203a31" stroke="{P['crema']}" stroke-width="10" stroke-linejoin="round"/>
    <ellipse cx="282" cy="184" rx="26" ry="8" fill="{P['lampada']}"/>
  </g>""")

# ---------------------------------------------------------------- #04 Traiettoria
grid = "".join(f'<line x1="92" y1="{y}" x2="420" y2="{y}"/>' for y in (172, 256, 340))
loghi["04"] = svg("04", "Traiettoria", f"""    <linearGradient id="g04bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f2119"/>
      <stop offset="1" stop-color="#07110c"/>
    </linearGradient>
    <linearGradient id="g04corpo" x1="96" y1="0" x2="420" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{P['foglia']}"/>
      <stop offset=".55" stop-color="{P['lampada']}"/>
      <stop offset="1" stop-color="{P['corallo']}"/>
    </linearGradient>
    <filter id="g04glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g04bg)"/>
    <g stroke="{P['foglia']}" stroke-opacity=".12" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 22">{grid}</g>
  </g>
  <g id="traiettoria" fill="none" stroke-linecap="round">
    <path id="g04path" d="M 104 344 C 160 344 162 262 218 262 C 274 262 278 334 330 304 C 356 289 366 252 378 222" stroke="url(#g04corpo)" stroke-width="46" opacity=".55" filter="url(#g04glow)"/>
    <path d="M 104 344 C 160 344 162 262 218 262 C 274 262 278 334 330 304 C 356 289 366 252 378 222" stroke="url(#g04corpo)" stroke-width="42"/>
  </g>
  <g id="testa" transform="translate(388 196) rotate(-62)">
    <path d="M -34 0 C -34 -26 -12 -34 8 -30 C 30 -24 40 -10 40 0 C 40 10 30 24 8 30 C -12 34 -34 26 -34 0 Z" fill="{P['corallo']}"/>
    <circle cx="14" cy="-12" r="6.5" fill="{P['notte']}"/>
  </g>
  <circle cx="104" cy="344" r="9" fill="{P['notte']}" opacity=".0"/>""")

# ---------------------------------------------------------------- #05 Vetro 3D (spirale avvolta)
spir = []
giri, r0, r1 = 2.05, 26, 132
n = 220
for i in range(n + 1):
    t = i / n
    a = -math.pi / 2 + t * giri * 2 * math.pi
    r = r0 + (r1 - r0) * t
    spir.append((256 + r * math.cos(a), 262 + r * math.sin(a)))
spir_d = smooth_path(spir[::4] + [spir[-1]])
end = spir[-1]
prev = spir[-6]
ang = math.degrees(math.atan2(end[1] - prev[1], end[0] - prev[0]))
loghi["05"] = svg("05", "Gemma di vetro", f"""    <radialGradient id="g05bg" cx="50%" cy="40%" r="75%">
      <stop offset="0" stop-color="#2a5a47"/>
      <stop offset=".6" stop-color="{P['bosco']}"/>
      <stop offset="1" stop-color="#08140f"/>
    </radialGradient>
    <radialGradient id="g05vetro" cx="40%" cy="30%" r="80%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".22"/>
      <stop offset=".6" stop-color="#ffffff" stop-opacity=".06"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity=".02"/>
    </radialGradient>
    <linearGradient id="g05corpo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{P['lampada']}"/>
      <stop offset=".5" stop-color="{P['amel']}"/>
      <stop offset="1" stop-color="{P['sella']}"/>
    </linearGradient>
    <linearGradient id="g05riflesso" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="g05ombra" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g05bg)"/>
    <ellipse cx="256" cy="440" rx="150" ry="26" fill="#000" opacity=".35" filter="url(#g05ombra)"/>
  </g>
  <g id="gemma">
    <circle cx="256" cy="256" r="184" fill="url(#g05vetro)" stroke="#ffffff" stroke-opacity=".28" stroke-width="4"/>
    <circle cx="256" cy="256" r="172" fill="none" stroke="{P['foglia']}" stroke-opacity=".25" stroke-width="2"/>
  </g>
  <g id="spirale" fill="none" stroke-linecap="round">
    <path d="{spir_d}" stroke="#000" stroke-opacity=".45" stroke-width="40" transform="translate(6 12)" filter="url(#g05ombra)"/>
    <path d="{spir_d}" stroke="url(#g05corpo)" stroke-width="38"/>
    <path d="{spir_d}" stroke="#fff" stroke-opacity=".38" stroke-width="8" transform="translate(-5 -6)"/>
  </g>
  <g id="testa" transform="translate({f(end[0])} {f(end[1])}) rotate({f(ang)})">
    <ellipse cx="14" cy="0" rx="34" ry="26" fill="{P['amel']}"/>
    <ellipse cx="10" cy="-8" rx="22" ry="9" fill="#fff" opacity=".35"/>
    <circle cx="24" cy="-11" r="5.5" fill="{P['occhio']}"/>
  </g>
  <g id="riflesso">
    <path d="M 120 196 A 150 150 0 0 1 300 92 A 170 170 0 0 0 132 230 Z" fill="url(#g05riflesso)" opacity=".55"/>
  </g>""")

# ---------------------------------------------------------------- #06 Monolinea editoriale
diag = []
for i in range(0, 41):
    t = i / 40
    x = 152 + t * (330 - 152)
    y = 360 + t * (182 - 360)
    amp = 30 * math.sin(math.pi * min(1, t * 1.15)) * (1 - 0.35 * t)
    off = amp * math.sin(t * 2.4 * math.pi)
    # normale alla diagonale (direzione (1,-1)/√2 -> normale (1,1)/√2)
    diag.append((x + off / math.sqrt(2), y + off / math.sqrt(2)))
loghi["06"] = svg("06", "Foglia monolinea", f"""    <linearGradient id="g06bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8f4ea"/>
      <stop offset="1" stop-color="#efe7d6"/>
    </linearGradient>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g06bg)"/></g>
  <g id="linea" fill="none" stroke="{P['inchiostro']}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 118 394 C 118 228 228 118 394 118 C 394 284 284 394 118 394 Z"/>
    <path d="{smooth_path(diag)}"/>
    <path d="M 98 414 L 132 380"/>
  </g>
  <g id="accento">
    <ellipse cx="0" cy="0" rx="22" ry="15" transform="translate(334 178) rotate(-45)" fill="{P['inchiostro']}"/>
    <path d="M 350 162 L 370 142 M 370 142 L 384 144 M 370 142 L 368 128" stroke="{P['corallo']}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="338" cy="168" r="4.5" fill="{P['carta']}"/>
  </g>""")

# ---------------------------------------------------------------- #07 Emblema tecnico
def hexagon(cx, cy, r, rot=0):
    return [(cx + r * math.cos(math.radians(60 * k + rot)), cy + r * math.sin(math.radians(60 * k + rot))) for k in range(6)]


def arc(cx, cy, r, a0, a1):
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f"M {f(x0)} {f(y0)} A {r} {r} 0 {large} 1 {f(x1)} {f(y1)}"


ticks = ""
for k in range(13):
    a = math.radians(135 + k * 22.5)
    r_in, r_out = (118, 134) if k % 3 else (112, 136)
    ticks += f'<line x1="{f(256 + r_in * math.cos(a))}" y1="{f(262 + r_in * math.sin(a))}" x2="{f(256 + r_out * math.cos(a))}" y2="{f(262 + r_out * math.sin(a))}"/>'
loghi["07"] = svg("07", "Emblema scaglia", f"""    <linearGradient id="g07bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{P['bosco']}"/>
      <stop offset="1" stop-color="{P['notte']}"/>
    </linearGradient>
    <linearGradient id="g07bordo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd08a"/>
      <stop offset="1" stop-color="{P['lampada']}"/>
    </linearGradient>
    <linearGradient id="g07testa" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{P['lampada']}"/>
      <stop offset="1" stop-color="{P['corallo']}"/>
    </linearGradient>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g07bg)"/></g>
  <g id="scaglia">
    <path d="{pts_path(hexagon(256, 262, 196, 30), True)}" fill="{P['muschio']}" stroke="url(#g07bordo)" stroke-width="20" stroke-linejoin="round"/>
    <path d="{pts_path(hexagon(256, 262, 168, 30), True)}" fill="{P['notte']}" opacity=".55"/>
  </g>
  <g id="quadrante" fill="none" stroke-linecap="round">
    <g stroke="{P['crema']}" stroke-opacity=".35" stroke-width="6">{ticks}</g>
    <path d="{arc(256, 262, 150, 135, 405)}" stroke="#ffffff" stroke-opacity=".12" stroke-width="14"/>
    <path d="{arc(256, 262, 150, 200, 340)}" stroke="{P['foglia']}" stroke-width="14"/>
  </g>
  <g id="testa">
    <path d="M 256 168 C 288 168 312 206 316 252 C 320 300 296 330 276 344 L 276 392 L 236 392 L 236 344 C 216 330 192 300 196 252 C 200 206 224 168 256 168 Z" fill="url(#g07testa)"/>
    <path d="M 256 196 L 292 286 L 256 268 L 220 286 Z" fill="{P['sella']}" stroke="{P['crema']}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="236" y="352" width="40" height="22" rx="10" fill="{P['sella']}" stroke="{P['crema']}" stroke-width="5"/>
    <circle cx="222" cy="236" r="10" fill="{P['occhio']}"/>
    <circle cx="290" cy="236" r="10" fill="{P['occhio']}"/>
    <circle cx="225" cy="233" r="3.5" fill="#fff"/>
    <circle cx="293" cy="233" r="3.5" fill="#fff"/>
  </g>""")

# ---------------------------------------------------------------- #08 Mascotte Pepe
loghi["08"] = svg("08", "Pepe mascotte", f"""    <radialGradient id="g08bg" cx="50%" cy="30%" r="80%">
      <stop offset="0" stop-color="#e6f7cf"/>
      <stop offset="1" stop-color="#b9e889"/>
    </radialGradient>
    <linearGradient id="g08pelle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffa24f"/>
      <stop offset="1" stop-color="{P['corallo']}"/>
    </linearGradient>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g08bg)"/>
    <circle cx="256" cy="250" r="196" fill="#fff" opacity=".28"/>
  </g>
  <g id="corpo" fill="none" stroke-linecap="round">
    <path d="M 300 300 C 320 392 400 392 452 404 C 500 416 512 470 512 520" stroke="url(#g08pelle)" stroke-width="92"/>
    <path d="M 344 360 L 362 388 M 408 386 L 412 418" stroke="{P['sella']}" stroke-width="26"/>
  </g>
  <g id="testa">
    <path d="M 256 112 C 352 112 402 170 402 236 C 402 304 340 340 256 340 C 172 340 110 304 110 236 C 110 170 160 112 256 112 Z" fill="url(#g08pelle)"/>
    <path d="M 222 142 C 236 130 276 130 290 142 C 292 166 220 166 222 142 Z" fill="{P['sella']}" stroke="{P['crema']}" stroke-width="7"/>
    <path d="M 160 176 C 168 164 190 162 198 172 C 196 188 164 192 160 176 Z" fill="{P['sella']}" stroke="{P['crema']}" stroke-width="6"/>
    <path d="M 314 172 C 322 162 344 164 352 176 C 348 192 316 188 314 172 Z" fill="{P['sella']}" stroke="{P['crema']}" stroke-width="6"/>
    <circle cx="182" cy="238" r="38" fill="{P['occhio']}"/>
    <circle cx="330" cy="238" r="38" fill="{P['occhio']}"/>
    <circle cx="194" cy="224" r="13" fill="#fff"/>
    <circle cx="342" cy="224" r="13" fill="#fff"/>
    <circle cx="172" cy="252" r="5" fill="#fff" opacity=".7"/>
    <circle cx="320" cy="252" r="5" fill="#fff" opacity=".7"/>
    <ellipse cx="150" cy="292" rx="22" ry="12" fill="#ff6f61" opacity=".45"/>
    <ellipse cx="362" cy="292" rx="22" ry="12" fill="#ff6f61" opacity=".45"/>
    <circle cx="238" cy="282" r="5" fill="#8a2a14"/>
    <circle cx="274" cy="282" r="5" fill="#8a2a14"/>
    <path d="M 222 306 Q 256 326 290 306" fill="none" stroke="#8a2a14" stroke-width="7" stroke-linecap="round"/>
  </g>
  <g id="lingua" fill="none" stroke="#e0244a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 256 320 L 256 366 M 256 366 L 242 384 M 256 366 L 270 384"/>
  </g>""")

# ---------------------------------------------------------------- #09 Nodi / sistema
curve = [(146, 392), (176, 330), (264, 318), (350, 296), (360, 232), (318, 186), (232, 188), (168, 164), (176, 112)]
# nodi: tipo, colore
nodi = [
    ((150, 384), P["acqua"]),      # acqua
    ((264, 318), P["foglia"]),     # salute / check
    ((360, 236), P["lampada"]),    # clima
    ((232, 188), P["crema"]),      # muta
]
nodi_svg = ""
for (x, y), c in nodi:
    nodi_svg += f'<circle cx="{x}" cy="{y}" r="32" fill="{c}" stroke="{P["notte"]}" stroke-width="12"/>'
loghi["09"] = svg("09", "Rete di cura", f"""    <radialGradient id="g09bg" cx="50%" cy="50%" r="75%">
      <stop offset="0" stop-color="{P['bosco']}"/>
      <stop offset="1" stop-color="#08140f"/>
    </radialGradient>
    <linearGradient id="g09linea" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="{P['acqua']}" stop-opacity=".7"/>
      <stop offset=".5" stop-color="{P['foglia']}" stop-opacity=".8"/>
      <stop offset="1" stop-color="{P['amel']}"/>
    </linearGradient>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g09bg)"/></g>
  <g id="spina">
    <path d="{smooth_path(curve)}" fill="none" stroke="url(#g09linea)" stroke-width="18" stroke-linecap="round"/>
  </g>
  <g id="nodi">{nodi_svg}</g>
  <g id="testa">
    <circle cx="176" cy="118" r="46" fill="{P['amel']}" stroke="{P['notte']}" stroke-width="12"/>
    <circle cx="192" cy="106" r="8" fill="{P['notte']}"/>
    <path d="M 214 128 L 236 140 M 236 140 L 248 134 M 236 140 L 242 152" stroke="{P['corallo']}" stroke-width="6" stroke-linecap="round"/>
  </g>""")

# ---------------------------------------------------------------- #10 Mosaico di scaglie
S = [
    "01111",
    "10000",
    "01110",
    "00001",
    "11110",
]
cell, gap = 54, 8
tot = 5 * cell + 4 * gap
x0 = y0 = 256 - tot / 2
celle = ""
for r, row in enumerate(S):
    for c, v in enumerate(row):
        x = x0 + c * (cell + gap)
        y = y0 + r * (cell + gap)
        if r == 0 and c == 4:
            fill, extra = P["foglia"], ""
        elif v == "1":
            fill, extra = P["crema"], ""
        else:
            fill, extra = "#ffffff", ' fill-opacity=".16"'
        celle += f'<rect x="{f(x)}" y="{f(y)}" width="{cell}" height="{cell}" rx="16" fill="{fill}"{extra}/>'
hx = x0 + 4 * (cell + gap) + cell / 2
hy = y0 + cell / 2
loghi["10"] = svg("10", "Mosaico di scaglie", f"""    <linearGradient id="g10bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffab4f"/>
      <stop offset=".55" stop-color="{P['corallo']}"/>
      <stop offset="1" stop-color="#c8372d"/>
    </linearGradient>""", f"""  <g id="sfondo"><rect width="512" height="512" fill="url(#g10bg)"/></g>
  <g id="scaglie">{celle}</g>
  <g id="occhio">
    <circle cx="{f(hx + 8)}" cy="{f(hy - 6)}" r="8" fill="{P['notte']}"/>
  </g>""")

for k, v in loghi.items():
    with open(os.path.join(OUT, f"logo-{k}.svg"), "w", encoding="utf-8") as fh:
        fh.write(v)
print("scritti", len(loghi), "loghi in", os.path.normpath(OUT))

# ---------------------------------------------------------------- preview.html (galleria autonoma)
import json
tpl_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "preview.template.html")
with open(tpl_path, encoding="utf-8") as fh:
    tpl = fh.read()
dati = json.dumps(loghi, ensure_ascii=False).replace("</", "<\\/")
with open(os.path.join(OUT, "preview.html"), "w", encoding="utf-8") as fh:
    fh.write(tpl.replace("__LOGHI__", dati))
print("scritta preview.html")
