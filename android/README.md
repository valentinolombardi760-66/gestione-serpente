# Gestione Serpente — app Android

Contenitore Android (WebView) per l'app `index.html`. Funziona offline: Chart.js è incluso negli asset.

## Come ottenere l'APK
1. Crea un repository vuoto su GitHub e carica il contenuto di questa cartella.
2. GitHub Actions compila l'APK a ogni push su `main` (workflow "Build APK").
3. Scarica `GestioneSerpente.apk` dalla sezione **Releases** del repository, dal telefono.
4. Aprilo e consenti "Installa app sconosciute" per il browser quando Android lo chiede.

## Aggiornare l'app
Dopo aver modificato `../index.html`:
```
python3 scripts/build_assets.py ../index.html percorso/chart.umd.js
```
e fai push: verrà generato un nuovo APK. Aumenta `versionCode` in `app/build.gradle` per installarlo sopra la versione precedente senza perdere i dati.
