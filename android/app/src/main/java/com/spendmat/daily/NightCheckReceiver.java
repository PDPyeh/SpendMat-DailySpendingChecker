package com.spendmat.daily;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

public class NightCheckReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SpendStore store = new SpendStore(context);
        try {
            JSONObject status = NightReminderManager.evaluateStatus(store);
            if (status.optBoolean("shouldNotify", false)) {
                String today = status.optString("today", "");
                String reminderTime = status.optString("reminderTime", "21:00");
                store.updateReminderMeta(today, SpendStore.nowIso(), null);
                NightReminderManager.showNotification(
                        context,
                        "SpendMat: Forgot to log today?",
                        "It is past " + reminderTime + " and today has no spending logged. Tap to add an entry or stamp a $0 no-spend day.",
                        false
                );
            }
        } catch (Exception ignored) {
        } finally {
            NightReminderManager.scheduleNextAlarm(context, store);
        }
    }
}
