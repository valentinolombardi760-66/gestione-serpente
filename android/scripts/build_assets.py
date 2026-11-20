"""Copia index.html negli asset Android sostituendo il CDN di Chart.js con la libreria inline (funziona offline)."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]); chart = pathlib.Path(sys.argv[2])
html = src.read_text(encoding="utf-8")
tag = re.search(r'<script src="https://cdn\.jsdelivr\.net/npm/chart\.js[^"]*"[^>]*></script>', html)
assert tag, "tag Chart.js non trovato"
lib = chart.read_text(encoding="utf-8").replace("</script", "<\\/script")
html = html[:tag.start()] + "<script>\n" + lib + "\n</script>" + html[tag.end():]
out = root / "app/src/main/assets/index.html"
out.write_text(html, encoding="utf-8"); print("scritto", out, len(html))
