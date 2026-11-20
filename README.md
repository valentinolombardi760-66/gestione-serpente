# 🐍 SNAKEcheck — Gestione Serpente del Grano

App web (PWA) in italiano per gestire parametri, salute e routine di un serpente del grano (*Pantherophis guttatus*): terrario interattivo con serpente disegnato in base al morph, clima, pasti, crescita, mute, manutenzione e handling, con alert automatici e grafici.

**Apri / installa:** https://valentinolombardi760-66.github.io/gestione-serpente/
Su Android apri il link in Chrome → ⋮ → *Installa app*. Funziona offline; i dati restano nel browser del dispositivo (usa *Esporta Backup JSON* in Impostazioni).

## Struttura
- `src/index.html` — **il sorgente da modificare** (Chart.js caricato da CDN)
- `index.html` — l'app pubblicata, generata da `npm run build` (Chart.js incluso per l'uso offline)
- `manifest.webmanifest`, `sw.js`, `icons/` — installazione, offline, scorciatoie e promemoria
- `tests/` — test automatici Playwright (PC e telefono), eseguiti da GitHub Actions a ogni push
- `android/` — progetto Android (WebView) opzionale; i suoi asset vengono aggiornati dalla build

## Sviluppo
```
npm install
npm run build   # rigenera index.html e gli asset Android
npm test        # build + test su PC e telefono
```
A ogni rilascio cambia `VERSION` in `sw.js`, così i telefoni ricevono l'aggiornamento.
