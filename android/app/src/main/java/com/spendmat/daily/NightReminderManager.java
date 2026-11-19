package com.spendmat.daily;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class NightReminderManager {
    public static final String CHANNEL_ID = "spendmat_night_check";
    public static final int NOTIFICATION_ID = 2100;
    public static final int TEST_NOTIFICATION_ID = 2101;
    public static final int ALARM_REQUEST_CODE = 4096;
    public static final String EXTRA_FOCUS_QUICK_ADD = "focus_quick_add";

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Night Spending Reminders",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Alerts you at night when today has no spending entries logged.");
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    public static boolean hasNotificationPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    private static Date parseIso(String iso) {
        if (iso == null || iso.isEmpty()) return null;
        try {
            SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
            return fmt.parse(iso);
        } catch (ParseException e) {
            return null;
        }
    }

    public static Calendar getTodayTargetCalendar(String timeStr, Date now) {
        int hour = 21;
        int minute = 0;
        if (timeStr != null && timeStr.contains(":")) {
            String[] parts = timeStr.split(":");
            try {
                hour = Integer.parseInt(parts[0]);
                minute = Integer.parseInt(parts[1]);
            } catch (NumberFormatException ignored) {
            }
        }
        Calendar cal = Calendar.getInstance();
        cal.setTime(now);
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal;
    }

    public static JSONObject evaluateStatus(SpendStore store) throws JSONException {
        Date now = new Date();
        String today = SpendStore.getLocalDateKey(now);
        JSONObject settings = store.getSettings();
        JSONObject meta = store.getReminderMeta();

        boolean enabled = settings.optBoolean("reminderEnabled", true);
        String reminderTime = settings.optString("reminderTime", "21:00");
        int repeatEveryMinutes = settings.optInt("repeatEveryMinutes", 0);

        boolean hasLoggedToday = store.hasInputForDate(today);
        boolean isNoSpendDay = store.isNoSpendDay(today);
        int entryCountToday = store.countEntriesForDate(today);

        Calendar targetCal = getTodayTargetCalendar(reminderTime, now);
        long msUntilTarget = targetCal.getTimeInMillis() - now.getTime();
        int minutesUntilTarget = (int) Math.max(0, Math.ceil(msUntilTarget / 60000.0));

        JSONObject result = new JSONObject();
        result.put("today", today);
        result.put("hasLoggedToday", hasLoggedToday);
        result.put("isNoSpendDay", isNoSpendDay);
        result.put("entryCountToday", entryCountToday);
        result.put("reminderTime", reminderTime);
        result.put("minutesUntilTarget", minutesUntilTarget);
        result.put("shouldNotify", false);
        result.put("snoozedUntil", JSONObject.NULL);

        if (!enabled) {
            result.put("status", "paused");
            return result;
        }

        if (hasLoggedToday) {
            result.put("status", "logged");
            return result;
        }

        if (now.getTime() < targetCal.getTimeInMillis()) {
            result.put("status", "armed");
            return result;
        }

        String snoozedIso = meta.isNull("snoozedUntil") ? null : meta.optString("snoozedUntil", null);
        Date snoozedDate = parseIso(snoozedIso);
        if (snoozedDate != null && now.getTime() < snoozedDate.getTime()) {
            result.put("status", "snoozed");
            result.put("snoozedUntil", snoozedIso);
            result.put("snoozeMinutesLeft", (int) Math.max(1, Math.ceil((snoozedDate.getTime() - now.getTime()) / 60000.0)));
            return result;
        }

        String lastNotifiedDate = meta.isNull("lastNotifiedDate") ? null : meta.optString("lastNotifiedDate", null);
        if (!today.equals(lastNotifiedDate)) {
            result.put("status", "overdue");
            result.put("shouldNotify", true);
            return result;
        }

        String lastNotifiedAtIso = meta.isNull("lastNotifiedAt") ? null : meta.optString("lastNotifiedAt", null);
        Date lastNotifiedAt = parseIso(lastNotifiedAtIso);
        if (repeatEveryMinutes > 0 && lastNotifiedAt != null) {
            double elapsedMins = (now.getTime() - lastNotifiedAt.getTime()) / 60000.0;
            if (elapsedMins >= repeatEveryMinutes) {
                result.put("status", "overdue");
                result.put("shouldNotify", true);
                return result;
            }
        }

        result.put("status", "notified");
        return result;
    }

    public static void scheduleNextAlarm(Context context, SpendStore store) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, NightCheckReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                ALARM_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        try {
            JSONObject settings = store.getSettings();
            if (!settings.optBoolean("reminderEnabled", true)) {
                alarmManager.cancel(pendingIntent);
                return;
            }

            Date now = new Date();
            String today = SpendStore.getLocalDateKey(now);
            JSONObject meta = store.getReminderMeta();
            String reminderTime = settings.optString("reminderTime", "21:00");
            int repeatEveryMinutes = settings.optInt("repeatEveryMinutes", 0);

            long triggerAtMillis;
            String snoozedIso = meta.isNull("snoozedUntil") ? null : meta.optString("snoozedUntil", null);
            Date snoozedDate = parseIso(snoozedIso);

            if (!store.hasInputForDate(today) && snoozedDate != null && snoozedDate.getTime() > now.getTime()) {
                triggerAtMillis = snoozedDate.getTime();
            } else {
                Calendar target = getTodayTargetCalendar(reminderTime, now);
                if (store.hasInputForDate(today)) {
                    target.add(Calendar.DAY_OF_YEAR, 1);
                    triggerAtMillis = target.getTimeInMillis();
                } else if (target.getTimeInMillis() > now.getTime()) {
                    triggerAtMillis = target.getTimeInMillis();
                } else {
                    String lastNotifiedDate = meta.isNull("lastNotifiedDate") ? null : meta.optString("lastNotifiedDate", null);
                    if (today.equals(lastNotifiedDate) && repeatEveryMinutes > 0) {
                        Date lastAt = parseIso(meta.isNull("lastNotifiedAt") ? null : meta.optString("lastNotifiedAt", null));
                        long base = lastAt != null ? lastAt.getTime() : now.getTime();
                        triggerAtMillis = Math.max(now.getTime() + 60000L, base + repeatEveryMinutes * 60000L);
                    } else {
                        target.add(Calendar.DAY_OF_YEAR, 1);
                        triggerAtMillis = target.getTimeInMillis();
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        } catch (Exception ignored) {
        }
    }

    public static boolean showNotification(Context context, String title, String body, boolean isTest) {
        ensureChannel(context);
        if (!hasNotificationPermission(context)) {
            return false;
        }

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.putExtra(EXTRA_FOCUS_QUICK_ADD, true);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent tapIntent = PendingIntent.getActivity(
                context,
                isTest ? 3001 : 3000,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_spendmat)
                .setColor(0xFF126CE2)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(tapIntent);

        NotificationManagerCompat.from(context).notify(
                isTest ? TEST_NOTIFICATION_ID : NOTIFICATION_ID,
                builder.build()
        );
        return true;
    }
}
