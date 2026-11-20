# 🐍 Corn Snake Manager — Gestione Serpente del Grano

App web (PWA) in italiano per gestire parametri, salute e routine di un serpente del grano (*Pantherophis guttatus*): clima del terrario, pasti, crescita, mute, manutenzione e handling, con alert automatici e grafici.

**Apri / installa:** https://valentinolombardi760-66.github.io/gestione-serpente/
Su Android apri il link in Chrome → ⋮ → *Installa app*. Funziona offline; i dati restano nel browser del dispositivo (usa *Esporta Backup JSON* in Impostazioni).

## Struttura
- `index.html` — l'app completa (CSS e JS inclusi, Chart.js 4.4.1 incluso per l'uso offline)
- `manifest.webmanifest`, `sw.js`, `icons/` — installazione e funzionamento offline
- `android/` — progetto Android (WebView) opzionale per generare un APK

Quando modifichi `index.html`, cambia `VERSION` in `sw.js` così i telefoni ricevono l'aggiornamento.
