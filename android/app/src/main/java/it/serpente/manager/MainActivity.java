package it.serpente.manager;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Contenitore Android dell'app web "Corn Snake Manager".
 * Carica index.html dagli asset (funziona offline, Chart.js è incluso)
 * e aggiunge ciò che una WebView non fa da sola:
 *  - salvataggio del backup JSON nella cartella Download;
 *  - selezione del file per l'importazione del backup.
 */
public class MainActivity extends Activity {

    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#0F1115"));
        getWindow().setNavigationBarColor(Color.parseColor("#181B21"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0F1115"));
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // localStorage per i dati del serpente
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setTextZoom(100);

        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try {
                    startActivityForResult(Intent.createChooser(intent, "Scegli il backup JSON"), FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST && fileCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
            fileCallback.onReceiveValue(result);
            fileCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        // Indietro: se non si è sulla Dashboard ci torna, altrimenti chiude l'app
        webView.evaluateJavascript(
            "(function(){var m=document.querySelector('[data-modal-close]');if(m){m.click();return 'modal';}" +
            "if(location.hash&&location.hash!=='#dashboard'){location.hash='dashboard';return 'nav';}return 'exit';})()",
            value -> {
                if (value != null && value.contains("exit")) MainActivity.super.onBackPressed();
            });
    }

    /** Metodi richiamabili dal JavaScript della pagina (window.AndroidBridge). */
    private class Bridge {
        @JavascriptInterface
        public boolean saveFile(String fileName, String content) {
            String safeName = fileName.replaceAll("[^A-Za-z0-9._-]", "_");
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = getContentResolver();
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                    values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) return false;
                    try (OutputStream out = resolver.openOutputStream(uri)) {
                        if (out == null) return false;
                        out.write(bytes);
                    }
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (!dir.exists() && !dir.mkdirs()) return false;
                    try (OutputStream out = new FileOutputStream(new File(dir, safeName))) {
                        out.write(bytes);
                    }
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }
}
