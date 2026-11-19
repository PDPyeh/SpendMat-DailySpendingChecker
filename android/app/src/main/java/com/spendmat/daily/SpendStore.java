package com.spendmat.daily;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.UUID;
import java.util.regex.Pattern;

public class SpendStore {
    private static final Pattern DATE_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern TIME_PATTERN = Pattern.compile("^\\d{2}:\\d{2}$");

    private static final String[] DEFAULT_CATEGORIES = new String[] {
            "Food & Drink",
            "Transport",
            "Groceries",
            "Bills & Utilities",
            "Shopping",
            "Health",
            "Entertainment",
            "Other"
    };

    private static final Object[][] CURRENCY_PRESETS = new Object[][] {
            { "USD", "$", 2, "USD ($)" },
            { "IDR", "Rp", 0, "IDR (Rp)" },
            { "EUR", "\u20ac", 2, "EUR (\u20ac)" },
            { "GBP", "\u00a3", 2, "GBP (\u00a3)" },
            { "JPY", "\u00a5", 0, "JPY (\u00a5)" },
            { "SGD", "S$", 2, "SGD (S$)" },
            { "MYR", "RM", 2, "MYR (RM)" }
    };

    private final File dataDir;
    private final File dataFile;
    private JSONObject data;
    private String lastLoadError = null;

    public SpendStore(Context context) {
        this.dataDir = new File(context.getFilesDir(), "spendmat-data");
        this.dataFile = new File(dataDir, "spending-data.json");
        this.data = load();
    }

    public synchronized String getLastLoadError() {
        return lastLoadError;
    }

    public static String getLocalDateKey(Date date) {
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        return fmt.format(date);
    }

    public static String nowIso() {
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
        return fmt.format(new Date());
    }

    public static boolean isValidDateKey(String value) {
        return value != null && DATE_PATTERN.matcher(value).matches();
    }

    public static boolean isValidTimeString(String value) {
        if (value == null || !TIME_PATTERN.matcher(value).matches()) {
            return false;
        }
        String[] parts = value.split(":");
        int h = Integer.parseInt(parts[0]);
        int m = Integer.parseInt(parts[1]);
        return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private JSONObject createEmptyData() {
        try {
            JSONObject root = new JSONObject();
            root.put("version", 1);
            root.put("entries", new JSONArray());
            root.put("noSpendDays", new JSONArray());

            JSONObject settings = new JSONObject();
            settings.put("currencyCode", "USD");
            settings.put("currencySymbol", "$");
            settings.put("currencyDecimals", 2);
            settings.put("dailyBudget", JSONObject.NULL);
            settings.put("reminderEnabled", true);
            settings.put("reminderTime", "21:00");
            settings.put("repeatEveryMinutes", 0);
            settings.put("minimizeToTray", false);
            settings.put("launchAtLogin", false);
            settings.put("theme", "day");
            root.put("settings", settings);

            JSONObject meta = new JSONObject();
            meta.put("lastNotifiedDate", JSONObject.NULL);
            meta.put("lastNotifiedAt", JSONObject.NULL);
            meta.put("snoozedUntil", JSONObject.NULL);
            root.put("reminderMeta", meta);
            return root;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    private JSONObject load() {
        try {
            if (!dataDir.exists()) {
                dataDir.mkdirs();
            }
            if (!dataFile.exists()) {
                JSONObject fresh = createEmptyData();
                persist(fresh);
                return fresh;
            }
            byte[] bytes = readAllBytes(dataFile);
            JSONObject parsed = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
            return normalize(parsed);
        } catch (Exception e) {
            lastLoadError = e.getMessage();
            return createEmptyData();
        }
    }

    private static byte[] readAllBytes(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] buf = new byte[(int) file.length()];
            int offset = 0;
            while (offset < buf.length) {
                int read = fis.read(buf, offset, buf.length - offset);
                if (read < 0) break;
                offset += read;
            }
            return buf;
        }
    }

    private JSONObject normalize(JSONObject raw) throws JSONException {
        JSONObject base = createEmptyData();
        if (raw == null) return base;

        JSONArray cleanEntries = new JSONArray();
        JSONArray rawEntries = raw.optJSONArray("entries");
        if (rawEntries != null) {
            for (int i = 0; i < rawEntries.length(); i++) {
                JSONObject item = rawEntries.optJSONObject(i);
                if (item == null) continue;
                String date = item.optString("date", "");
                double amount = item.optDouble("amount", 0);
                if (!isValidDateKey(date) || Double.isNaN(amount) || Double.isInfinite(amount) || amount <= 0) {
                    continue;
                }
                JSONObject clean = new JSONObject();
                String id = item.optString("id", "");
                clean.put("id", id.isEmpty() ? UUID.randomUUID().toString() : id);
                clean.put("date", date);
                clean.put("amount", round2(amount));
                String category = item.optString("category", "Other").trim();
                clean.put("category", category.isEmpty() ? "Other" : category);
                String note = item.optString("note", "").trim();
                if (note.length() > 140) note = note.substring(0, 140);
                clean.put("note", note);
                clean.put("createdAt", item.optString("createdAt", nowIso()));
                clean.put("updatedAt", item.optString("updatedAt", nowIso()));
                cleanEntries.put(clean);
            }
        }
        base.put("entries", cleanEntries);

        Set<String> noSpendSet = new LinkedHashSet<>();
        JSONArray rawNoSpend = raw.optJSONArray("noSpendDays");
        if (rawNoSpend != null) {
            for (int i = 0; i < rawNoSpend.length(); i++) {
                String d = rawNoSpend.optString(i, "");
                if (isValidDateKey(d)) noSpendSet.add(d);
            }
        }
        JSONArray cleanNoSpend = new JSONArray();
        for (String d : noSpendSet) cleanNoSpend.put(d);
        base.put("noSpendDays", cleanNoSpend);

        JSONObject rawSettings = raw.optJSONObject("settings");
        JSONObject settings = base.getJSONObject("settings");
        if (rawSettings != null) {
            settings.put("currencyCode", rawSettings.optString("currencyCode", "USD"));
            settings.put("currencySymbol", rawSettings.optString("currencySymbol", "$"));
            settings.put("currencyDecimals", rawSettings.optInt("currencyDecimals", 2));
            if (!rawSettings.isNull("dailyBudget")) {
                double b = rawSettings.optDouble("dailyBudget", -1);
                if (!Double.isNaN(b) && !Double.isInfinite(b) && b > 0) {
                    settings.put("dailyBudget", round2(b));
                }
            }
            settings.put("reminderEnabled", rawSettings.optBoolean("reminderEnabled", true));
            String rt = rawSettings.optString("reminderTime", "21:00");
            settings.put("reminderTime", isValidTimeString(rt) ? rt : "21:00");
            int rep = rawSettings.optInt("repeatEveryMinutes", 0);
            settings.put("repeatEveryMinutes", (rep == 0 || rep == 30 || rep == 60) ? rep : 0);
            settings.put("theme", "night".equals(rawSettings.optString("theme", "day")) ? "night" : "day");
        }

        JSONObject rawMeta = raw.optJSONObject("reminderMeta");
        JSONObject meta = base.getJSONObject("reminderMeta");
        if (rawMeta != null) {
            String lnd = rawMeta.isNull("lastNotifiedDate") ? null : rawMeta.optString("lastNotifiedDate", null);
            meta.put("lastNotifiedDate", isValidDateKey(lnd) ? lnd : JSONObject.NULL);
            meta.put("lastNotifiedAt", rawMeta.isNull("lastNotifiedAt") ? JSONObject.NULL : rawMeta.optString("lastNotifiedAt", null));
            meta.put("snoozedUntil", rawMeta.isNull("snoozedUntil") ? JSONObject.NULL : rawMeta.optString("snoozedUntil", null));
        }

        return base;
    }

    private void persist(JSONObject target) throws IOException {
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }
        File tmp = new File(dataDir, "spending-data.json.tmp");
        try (FileOutputStream fos = new FileOutputStream(tmp)) {
            fos.write(target.toString(2).getBytes(StandardCharsets.UTF_8));
            fos.getFD().sync();
        } catch (JSONException e) {
            throw new IOException(e);
        }
        if (dataFile.exists()) {
            dataFile.delete();
        }
        if (!tmp.renameTo(dataFile)) {
            throw new IOException("Could not save spending data file.");
        }
    }

    public synchronized JSONObject getState() throws JSONException {
        JSONObject state = new JSONObject();
        state.put("entries", new JSONArray(data.getJSONArray("entries").toString()));
        state.put("noSpendDays", new JSONArray(data.getJSONArray("noSpendDays").toString()));
        state.put("settings", new JSONObject(data.getJSONObject("settings").toString()));
        state.put("reminderMeta", new JSONObject(data.getJSONObject("reminderMeta").toString()));

        JSONArray cats = new JSONArray();
        for (String c : DEFAULT_CATEGORIES) cats.put(c);
        state.put("categories", cats);

        JSONArray presets = new JSONArray();
        for (Object[] p : CURRENCY_PRESETS) {
            JSONObject obj = new JSONObject();
            obj.put("code", p[0]);
            obj.put("symbol", p[1]);
            obj.put("decimals", p[2]);
            obj.put("label", p[3]);
            presets.put(obj);
        }
        state.put("currencyPresets", presets);
        state.put("dataFilePath", dataFile.getAbsolutePath());
        return state;
    }

    public synchronized JSONObject getSettings() throws JSONException {
        return new JSONObject(data.getJSONObject("settings").toString());
    }

    public synchronized JSONObject getReminderMeta() throws JSONException {
        return new JSONObject(data.getJSONObject("reminderMeta").toString());
    }

    public synchronized boolean hasInputForDate(String dateKey) {
        return countEntriesForDate(dateKey) > 0 || isNoSpendDay(dateKey);
    }

    public synchronized int countEntriesForDate(String dateKey) {
        JSONArray entries = data.optJSONArray("entries");
        if (entries == null) return 0;
        int count = 0;
        for (int i = 0; i < entries.length(); i++) {
            JSONObject item = entries.optJSONObject(i);
            if (item != null && dateKey.equals(item.optString("date"))) {
                count++;
            }
        }
        return count;
    }

    public synchronized boolean isNoSpendDay(String dateKey) {
        JSONArray arr = data.optJSONArray("noSpendDays");
        if (arr == null) return false;
        for (int i = 0; i < arr.length(); i++) {
            if (dateKey.equals(arr.optString(i))) return true;
        }
        return false;
    }

    private void removeNoSpendDay(String dateKey) throws JSONException {
        JSONArray arr = data.getJSONArray("noSpendDays");
        JSONArray next = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            String d = arr.getString(i);
            if (!d.equals(dateKey)) next.put(d);
        }
        data.put("noSpendDays", next);
    }

    public synchronized JSONObject addEntry(JSONObject payload) throws Exception {
        String date = payload.optString("date", "");
        if (!isValidDateKey(date)) {
            throw new IllegalArgumentException("Please choose a valid date.");
        }
        double amount = payload.optDouble("amount", -1);
        if (Double.isNaN(amount) || Double.isInfinite(amount) || amount <= 0) {
            throw new IllegalArgumentException("Amount must be a number greater than zero.");
        }
        String category = payload.optString("category", "Other").trim();
        if (category.isEmpty()) category = "Other";
        String note = payload.optString("note", "").trim();
        if (note.length() > 140) note = note.substring(0, 140);

        String now = nowIso();
        JSONObject entry = new JSONObject();
        entry.put("id", UUID.randomUUID().toString());
        entry.put("date", date);
        entry.put("amount", round2(amount));
        entry.put("category", category);
        entry.put("note", note);
        entry.put("createdAt", now);
        entry.put("updatedAt", now);

        JSONArray existing = data.getJSONArray("entries");
        JSONArray next = new JSONArray();
        next.put(entry);
        for (int i = 0; i < existing.length(); i++) {
            next.put(existing.get(i));
        }
        data.put("entries", next);
        removeNoSpendDay(date);
        persist(data);
        return entry;
    }

    public synchronized JSONObject updateEntry(String id, JSONObject patch) throws Exception {
        JSONArray entries = data.getJSONArray("entries");
        for (int i = 0; i < entries.length(); i++) {
            JSONObject existing = entries.getJSONObject(i);
            if (!id.equals(existing.optString("id"))) continue;

            String nextDate = patch.has("date") ? patch.optString("date", existing.getString("date")) : existing.getString("date");
            if (!isValidDateKey(nextDate)) {
                throw new IllegalArgumentException("Please choose a valid date.");
            }
            double nextAmount = patch.has("amount") ? patch.optDouble("amount", -1) : existing.getDouble("amount");
            if (Double.isNaN(nextAmount) || Double.isInfinite(nextAmount) || nextAmount <= 0) {
                throw new IllegalArgumentException("Amount must be a number greater than zero.");
            }
            String nextCategory = patch.has("category") ? patch.optString("category", "").trim() : existing.getString("category");
            if (nextCategory.isEmpty()) nextCategory = existing.getString("category");
            String nextNote = patch.has("note") ? patch.optString("note", "").trim() : existing.optString("note", "");
            if (nextNote.length() > 140) nextNote = nextNote.substring(0, 140);

            existing.put("date", nextDate);
            existing.put("amount", round2(nextAmount));
            existing.put("category", nextCategory);
            existing.put("note", nextNote);
            existing.put("updatedAt", nowIso());

            removeNoSpendDay(nextDate);
            persist(data);
            return new JSONObject(existing.toString());
        }
        throw new IllegalArgumentException("Spending entry was not found.");
    }

    public synchronized void deleteEntry(String id) throws Exception {
        JSONArray entries = data.getJSONArray("entries");
        JSONArray next = new JSONArray();
        boolean found = false;
        for (int i = 0; i < entries.length(); i++) {
            JSONObject item = entries.getJSONObject(i);
            if (id.equals(item.optString("id"))) {
                found = true;
            } else {
                next.put(item);
            }
        }
        if (!found) {
            throw new IllegalArgumentException("Spending entry was not found.");
        }
        data.put("entries", next);
        persist(data);
    }

    public synchronized boolean toggleNoSpendDay(String dateKey, Boolean forceValue) throws Exception {
        if (!isValidDateKey(dateKey)) {
            throw new IllegalArgumentException("Please choose a valid date.");
        }
        if (countEntriesForDate(dateKey) > 0) {
            throw new IllegalArgumentException("Delete entries for this day before stamping it as a no-spend day.");
        }
        boolean exists = isNoSpendDay(dateKey);
        boolean shouldMark = forceValue != null ? forceValue : !exists;
        if (shouldMark && !exists) {
            data.getJSONArray("noSpendDays").put(dateKey);
        } else if (!shouldMark && exists) {
            removeNoSpendDay(dateKey);
        }
        persist(data);
        return shouldMark;
    }

    public synchronized JSONObject updateSettings(JSONObject patch) throws Exception {
        JSONObject settings = data.getJSONObject("settings");
        if (patch.has("currencyCode")) {
            String code = patch.optString("currencyCode", "");
            for (Object[] p : CURRENCY_PRESETS) {
                if (code.equals(p[0])) {
                    settings.put("currencyCode", p[0]);
                    settings.put("currencySymbol", p[1]);
                    settings.put("currencyDecimals", p[2]);
                    break;
                }
            }
        }
        if (patch.has("dailyBudget")) {
            if (patch.isNull("dailyBudget") || "".equals(patch.optString("dailyBudget", ""))) {
                settings.put("dailyBudget", JSONObject.NULL);
            } else {
                double val = patch.optDouble("dailyBudget", -1);
                if (Double.isNaN(val) || Double.isInfinite(val) || val <= 0) {
                    throw new IllegalArgumentException("Daily budget must be empty or a positive number.");
                }
                settings.put("dailyBudget", round2(val));
            }
        }
        if (patch.has("reminderEnabled")) {
            settings.put("reminderEnabled", patch.getBoolean("reminderEnabled"));
        }
        if (patch.has("reminderTime")) {
            String rt = patch.optString("reminderTime", "");
            if (!isValidTimeString(rt)) {
                throw new IllegalArgumentException("Reminder time must use 24-hour HH:MM format.");
            }
            settings.put("reminderTime", rt);
        }
        if (patch.has("repeatEveryMinutes")) {
            int rep = patch.optInt("repeatEveryMinutes", 0);
            if (rep != 0 && rep != 30 && rep != 60) {
                throw new IllegalArgumentException("Repeat interval must be 0, 30, or 60 minutes.");
            }
            settings.put("repeatEveryMinutes", rep);
        }
        if (patch.has("theme")) {
            settings.put("theme", "night".equals(patch.optString("theme")) ? "night" : "day");
        }
        persist(data);
        return new JSONObject(settings.toString());
    }

    public synchronized void updateReminderMeta(String lastNotifiedDate, String lastNotifiedAt, String snoozedUntil) throws Exception {
        JSONObject meta = data.getJSONObject("reminderMeta");
        meta.put("lastNotifiedDate", lastNotifiedDate == null ? JSONObject.NULL : lastNotifiedDate);
        meta.put("lastNotifiedAt", lastNotifiedAt == null ? JSONObject.NULL : lastNotifiedAt);
        meta.put("snoozedUntil", snoozedUntil == null ? JSONObject.NULL : snoozedUntil);
        persist(data);
    }

    public synchronized String exportCsv() throws JSONException {
        JSONObject settings = data.getJSONObject("settings");
        int decimals = settings.optInt("currencyDecimals", 2);
        String code = settings.optString("currencyCode", "USD");
        JSONArray entries = data.getJSONArray("entries");

        List<JSONObject> list = new ArrayList<>();
        for (int i = 0; i < entries.length(); i++) {
            list.add(entries.getJSONObject(i));
        }
        Collections.sort(list, (a, b) -> {
            String da = a.optString("date", "");
            String db = b.optString("date", "");
            if (da.equals(db)) {
                return a.optString("createdAt", "").compareTo(b.optString("createdAt", ""));
            }
            return db.compareTo(da);
        });

        StringBuilder sb = new StringBuilder();
        sb.append("Date,Category,Note,Amount,Currency,Recorded At\r\n");
        String numFmt = "%." + decimals + "f";
        for (JSONObject entry : list) {
            sb.append(escapeCsv(entry.optString("date", ""))).append(',')
                    .append(escapeCsv(entry.optString("category", ""))).append(',')
                    .append(escapeCsv(entry.optString("note", ""))).append(',')
                    .append(String.format(Locale.US, numFmt, entry.optDouble("amount", 0))).append(',')
                    .append(escapeCsv(code)).append(',')
                    .append(escapeCsv(entry.optString("createdAt", ""))).append("\r\n");
        }
        return sb.toString();
    }

    private static String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n") || val.contains("\r")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    public synchronized String exportBackupJson() throws JSONException {
        return data.toString(2);
    }

    public synchronized JSONObject importBackupJson(String rawText) throws Exception {
        JSONObject parsed;
        try {
            parsed = new JSONObject(rawText);
        } catch (JSONException e) {
            throw new IllegalArgumentException("Backup file is not valid JSON.");
        }
        if (!parsed.has("entries") || parsed.optJSONArray("entries") == null) {
            throw new IllegalArgumentException("Backup file is missing spending entries.");
        }
        data = normalize(parsed);
        persist(data);
        return getState();
    }

    public synchronized JSONObject resetAllData() throws Exception {
        JSONObject currentSettings = getSettings();
        data = createEmptyData();
        data.put("settings", currentSettings);
        persist(data);
        return getState();
    }
}
