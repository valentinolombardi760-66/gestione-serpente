// Costruisce l'app pubblicata da src/index.html:
//  - inserisce Chart.js dentro la pagina (funziona offline e senza CDN);
//  - scrive index.html nella radice (GitHub Pages) e negli asset Android.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/index.html'), 'utf8');
const chartPath = join(root, 'node_modules/chart.js/dist/chart.umd.js');
const chart = readFileSync(chartPath, 'utf8').replace(/<\/script/gi, '<\\/script');

const TAG = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@[^"]+"[^>]*><\/script>/;
if (!TAG.test(src)) throw new Error('Tag di Chart.js non trovato in src/index.html');
const out = src.replace(TAG, () => `<script>/* Chart.js 4.4.1 (MIT) */\n${chart}\n</script>`);

const targets = ['index.html', 'android/app/src/main/assets/index.html'];
for (const t of targets) {
  const p = join(root, t);
  if (t.startsWith('android') && !existsSync(join(root, 'android'))) continue;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, out);
  console.log(`scritto ${t} (${Math.round(out.length / 1024)} KB)`);
}
