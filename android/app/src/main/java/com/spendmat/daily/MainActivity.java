package com.spendmat.daily;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Date;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private SpendStore store;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private String pendingExportContent = null;
    private boolean pendingFocusQuickAdd = false;

    private final Runnable foregroundTicker = new Runnable() {
        @Override
        public void run() {
            checkReminderInForeground();
            mainHandler.postDelayed(this, 30000L);
        }
    };

    private final ActivityResultLauncher<String> notificationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> pushStateUpdate());

    private final ActivityResultLauncher<String> createCsvLauncher =
            registerForActivityResult(new ActivityResultContracts.CreateDocument("text/csv"), this::writePendingExportToUri);

    private final ActivityResultLauncher<String> createJsonLauncher =
            registerForActivityResult(new ActivityResultContracts.CreateDocument("application/json"), this::writePendingExportToUri);

    private final ActivityResultLauncher<String[]> openJsonLauncher =
            registerForActivityResult(new ActivityResultContracts.OpenDocument(), this::importBackupFromUri);

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        store = new SpendStore(this);
        NightReminderManager.ensureChannel(this);
        NightReminderManager.scheduleNextAlarm(this, store);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && !NightReminderManager.hasNotificationPermission(this)) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
        }

        if (getIntent() != null && getIntent().getBooleanExtra(NightReminderManager.EXTRA_FOCUS_QUICK_ADD, false)) {
            pendingFocusQuickAdd = true;
        }

        webView = new WebView(this);
        setContentView(webView);

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(false);
        ws.setBuiltInZoomControls(false);
        ws.setDisplayZoomControls(false);

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (pendingFocusQuickAdd) {
                    pendingFocusQuickAdd = false;
                    notifyFocusQuickAdd();
                }
            }
        });

        webView.addJavascriptInterface(new SpendBridge(), "AndroidSpendBridge");
        webView.loadUrl("https://appassets.androidplatform.net/assets/src/renderer/index.html");

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                webView.evaluateJavascript("window.__handleAndroidBack ? window.__handleAndroidBack() : false", value -> {
                    if (!"true".equals(value)) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                        setEnabled(true);
                    }
                });
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra(NightReminderManager.EXTRA_FOCUS_QUICK_ADD, false)) {
            notifyFocusQuickAdd();
        }
        pushStateUpdate();
    }

    @Override
    protected void onResume() {
        super.onResume();
        mainHandler.removeCallbacks(foregroundTicker);
        mainHandler.post(foregroundTicker);
    }

    @Override
    protected void onPause() {
        super.onPause();
        mainHandler.removeCallbacks(foregroundTicker);
        NightReminderManager.scheduleNextAlarm(this, store);
    }

    private void checkReminderInForeground() {
        try {
            JSONObject status = NightReminderManager.evaluateStatus(store);
            if (status.optBoolean("shouldNotify", false)) {
                String today = status.optString("today", "");
                String reminderTime = status.optString("reminderTime", "21:00");
                store.updateReminderMeta(today, SpendStore.nowIso(), null);
                NightReminderManager.showNotification(
                        this,
                        "SpendMat: Forgot to log today?",
                        "It is past " + reminderTime + " and today has no spending logged. Tap to add an entry or stamp a $0 no-spend day.",
                        false
                );
                NightReminderManager.scheduleNextAlarm(this, store);
                JSONObject event = new JSONObject();
                event.put("isTest", false);
                event.put("triggeredAt", SpendStore.nowIso());
                dispatchJs("window.__onAndroidReminderTriggered", event.toString());
            }
            pushStateUpdate();
        } catch (Exception ignored) {
        }
    }

    private void pushStateUpdate() {
        try {
            JSONObject payload = new JSONObject();
            payload.put("state", store.getState());
            payload.put("reminderStatus", NightReminderManager.evaluateStatus(store));
            dispatchJs("window.__onAndroidStateUpdated", payload.toString());
        } catch (Exception ignored) {
        }
    }

    private void notifyFocusQuickAdd() {
        mainHandler.post(() -> {
            if (webView != null) {
                webView.evaluateJavascript("if (window.__onAndroidFocusQuickAdd) window.__onAndroidFocusQuickAdd();", null);
            }
        });
    }

    private void dispatchJs(String fnName, String jsonArg) {
        String quoted = JSONObject.quote(jsonArg);
        mainHandler.post(() -> {
            if (webView != null) {
                webView.evaluateJavascript("if (" + fnName + ") " + fnName + "(" + quoted + ");", null);
            }
        });
    }

    private void writePendingExportToUri(Uri uri) {
        try {
            if (uri == null || pendingExportContent == null) {
                JSONObject res = new JSONObject();
                res.put("ok", true);
                JSONObject data = new JSONObject();
                data.put("canceled", true);
                res.put("data", data);
                dispatchJs("window.__resolveAndroidExport", res.toString());
                return;
            }
            try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                if (os == null) throw new IllegalStateException("Could not open file for writing.");
                os.write(pendingExportContent.getBytes(StandardCharsets.UTF_8));
            }
            JSONObject data = new JSONObject();
            data.put("canceled", false);
            data.put("filePath", uri.toString());
            dispatchJs("window.__resolveAndroidExport", ok(data));
        } catch (Exception e) {
            dispatchJs("window.__resolveAndroidExport", fail(e.getMessage()));
        } finally {
            pendingExportContent = null;
        }
    }

    private void importBackupFromUri(Uri uri) {
        try {
            if (uri == null) {
                JSONObject data = new JSONObject();
                data.put("canceled", true);
                dispatchJs("window.__resolveAndroidImport", ok(data));
                return;
            }
            StringBuilder sb = new StringBuilder();
            try (InputStream is = getContentResolver().openInputStream(uri);
                 BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append('\n');
                }
            }
            JSONObject state = store.importBackupJson(sb.toString());
            NightReminderManager.scheduleNextAlarm(this, store);
            JSONObject data = new JSONObject();
            data.put("canceled", false);
            data.put("state", state);
            data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
            dispatchJs("window.__resolveAndroidImport", ok(data));
        } catch (Exception e) {
            dispatchJs("window.__resolveAndroidImport", fail(e.getMessage()));
        }
    }

    private static String ok(JSONObject data) {
        try {
            JSONObject res = new JSONObject();
            res.put("ok", true);
            res.put("data", data);
            return res.toString();
        } catch (JSONException e) {
            return "{\"ok\":false,\"error\":\"Serialization error.\"}";
        }
    }

    private static String fail(String message) {
        try {
            JSONObject res = new JSONObject();
            res.put("ok", false);
            res.put("error", message == null || message.isEmpty() ? "Unexpected Android error." : message);
            return res.toString();
        } catch (JSONException e) {
            return "{\"ok\":false,\"error\":\"Unexpected Android error.\"}";
        }
    }

    private class SpendBridge {
        @JavascriptInterface
        public String getState() {
            try {
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("state", store.getState());
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                data.put("notificationsSupported", NightReminderManager.hasNotificationPermission(MainActivity.this));
                data.put("loadWarning", store.getLastLoadError() == null ? JSONObject.NULL : store.getLastLoadError());
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String addEntry(String payloadJson) {
            try {
                JSONObject entry = store.addEntry(new JSONObject(payloadJson));
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("entry", entry);
                data.put("state", store.getState());
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String updateEntry(String payloadJson) {
            try {
                JSONObject req = new JSONObject(payloadJson);
                JSONObject entry = store.updateEntry(req.getString("id"), req.getJSONObject("patch"));
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("entry", entry);
                data.put("state", store.getState());
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String deleteEntry(String payloadJson) {
            try {
                JSONObject req = new JSONObject(payloadJson);
                store.deleteEntry(req.getString("id"));
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("state", store.getState());
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String toggleNoSpendDay(String payloadJson) {
            try {
                JSONObject req = new JSONObject(payloadJson);
                Boolean forceVal = req.has("forceValue") && !req.isNull("forceValue")
                        ? req.getBoolean("forceValue")
                        : null;
                boolean marked = store.toggleNoSpendDay(req.getString("date"), forceVal);
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("marked", marked);
                data.put("state", store.getState());
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String updateSettings(String payloadJson) {
            try {
                JSONObject settings = store.updateSettings(new JSONObject(payloadJson));
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("settings", settings);
                data.put("state", store.getState());
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String testReminder() {
            try {
                if (!NightReminderManager.hasNotificationPermission(MainActivity.this)) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        mainHandler.post(() -> notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS));
                    }
                    return fail("Please allow Android notifications first, then tap Send Test Notification again.");
                }
                NightReminderManager.showNotification(
                        MainActivity.this,
                        "SpendMat: Night Spending Check (Test)",
                        "Automatic Android night reminders are working. Tap to open your notebook sheet.",
                        true
                );
                JSONObject data = new JSONObject();
                data.put("sentAt", SpendStore.nowIso());
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String snoozeReminder(String payloadJson) {
            try {
                JSONObject req = new JSONObject(payloadJson);
                int mins = Math.max(1, req.optInt("minutes", 30));
                Date until = new Date(System.currentTimeMillis() + mins * 60000L);
                java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US);
                fmt.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                store.updateReminderMeta(null, null, fmt.format(until));
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("state", store.getState());
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public String requestNotificationPermission() {
            try {
                boolean granted = NightReminderManager.hasNotificationPermission(MainActivity.this);
                if (!granted && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    mainHandler.post(() -> notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS));
                }
                JSONObject data = new JSONObject();
                data.put("granted", granted);
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }

        @JavascriptInterface
        public void exportCsv() {
            try {
                pendingExportContent = store.exportCsv();
                String today = SpendStore.getLocalDateKey(new Date());
                mainHandler.post(() -> createCsvLauncher.launch("spendmat-export-" + today + ".csv"));
            } catch (Exception e) {
                dispatchJs("window.__resolveAndroidExport", fail(e.getMessage()));
            }
        }

        @JavascriptInterface
        public void exportBackup() {
            try {
                pendingExportContent = store.exportBackupJson();
                String today = SpendStore.getLocalDateKey(new Date());
                mainHandler.post(() -> createJsonLauncher.launch("spendmat-backup-" + today + ".json"));
            } catch (Exception e) {
                dispatchJs("window.__resolveAndroidExport", fail(e.getMessage()));
            }
        }

        @JavascriptInterface
        public void importBackup() {
            mainHandler.post(() -> openJsonLauncher.launch(new String[] { "application/json", "text/plain", "*/*" }));
        }

        @JavascriptInterface
        public String openDataFolder() {
            return fail("Use Export JSON Backup or Export CSV on Android.");
        }

        @JavascriptInterface
        public String resetAllData() {
            try {
                JSONObject state = store.resetAllData();
                NightReminderManager.scheduleNextAlarm(MainActivity.this, store);
                JSONObject data = new JSONObject();
                data.put("state", state);
                data.put("reminderStatus", NightReminderManager.evaluateStatus(store));
                return ok(data);
            } catch (Exception e) {
                return fail(e.getMessage());
            }
        }
    }
}
