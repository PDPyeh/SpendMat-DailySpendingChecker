function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getReminderTargetDate(now, timeStr) {
  const [hours, minutes] = String(timeStr || '21:00').split(':').map(Number);
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Number.isFinite(hours) ? hours : 21,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );
}

class NightReminderScheduler {
  constructor({ store, onNotify, onStatusChange, nowProvider }) {
    this.store = store;
    this.onNotify = onNotify || (() => {});
    this.onStatusChange = onStatusChange || (() => {});
    this.nowProvider = nowProvider || (() => new Date());
    this.timer = null;
    this.lastStatusSignature = '';
  }

  evaluate(now = this.nowProvider()) {
    const state = this.store.getState();
    const { settings, reminderMeta } = state;
    const today = getLocalDateKey(now);
    const hasLoggedToday = this.store.hasInputForDate(today);
    const isNoSpendDay = state.noSpendDays.includes(today);
    const entryCountToday = state.entries.filter((e) => e.date === today).length;
    const targetTime = getReminderTargetDate(now, settings.reminderTime);
    const msUntilTarget = targetTime.getTime() - now.getTime();
    const minutesUntilTarget = Math.max(0, Math.ceil(msUntilTarget / 60000));

    if (!settings.reminderEnabled) {
      return {
        today,
        status: 'paused',
        shouldNotify: false,
        hasLoggedToday,
        isNoSpendDay,
        entryCountToday,
        reminderTime: settings.reminderTime,
        minutesUntilTarget,
        snoozedUntil: null
      };
    }

    if (hasLoggedToday) {
      return {
        today,
        status: 'logged',
        shouldNotify: false,
        hasLoggedToday: true,
        isNoSpendDay,
        entryCountToday,
        reminderTime: settings.reminderTime,
        minutesUntilTarget,
        snoozedUntil: null
      };
    }

    if (now.getTime() < targetTime.getTime()) {
      return {
        today,
        status: 'armed',
        shouldNotify: false,
        hasLoggedToday: false,
        isNoSpendDay: false,
        entryCountToday: 0,
        reminderTime: settings.reminderTime,
        minutesUntilTarget,
        snoozedUntil: null
      };
    }

    const snoozedUntilDate = reminderMeta.snoozedUntil ? new Date(reminderMeta.snoozedUntil) : null;
    if (snoozedUntilDate && !Number.isNaN(snoozedUntilDate.getTime()) && now.getTime() < snoozedUntilDate.getTime()) {
      return {
        today,
        status: 'snoozed',
        shouldNotify: false,
        hasLoggedToday: false,
        isNoSpendDay: false,
        entryCountToday: 0,
        reminderTime: settings.reminderTime,
        minutesUntilTarget: 0,
        snoozedUntil: snoozedUntilDate.toISOString(),
        snoozeMinutesLeft: Math.max(1, Math.ceil((snoozedUntilDate.getTime() - now.getTime()) / 60000))
      };
    }

    const alreadyNotifiedToday = reminderMeta.lastNotifiedDate === today;
    if (!alreadyNotifiedToday) {
      return {
        today,
        status: 'overdue',
        shouldNotify: true,
        hasLoggedToday: false,
        isNoSpendDay: false,
        entryCountToday: 0,
        reminderTime: settings.reminderTime,
        minutesUntilTarget: 0,
        snoozedUntil: null
      };
    }

    if (settings.repeatEveryMinutes > 0 && reminderMeta.lastNotifiedAt) {
      const lastSent = new Date(reminderMeta.lastNotifiedAt);
      const elapsedMinutes = (now.getTime() - lastSent.getTime()) / 60000;
      if (!Number.isNaN(lastSent.getTime()) && elapsedMinutes >= settings.repeatEveryMinutes) {
        return {
          today,
          status: 'overdue',
          shouldNotify: true,
          hasLoggedToday: false,
          isNoSpendDay: false,
          entryCountToday: 0,
          reminderTime: settings.reminderTime,
          minutesUntilTarget: 0,
          snoozedUntil: null
        };
      }
    }

    return {
      today,
      status: 'notified',
      shouldNotify: false,
      hasLoggedToday: false,
      isNoSpendDay: false,
      entryCountToday: 0,
      reminderTime: settings.reminderTime,
      minutesUntilTarget: 0,
      snoozedUntil: null,
      lastNotifiedAt: reminderMeta.lastNotifiedAt
    };
  }

  tick() {
    const now = this.nowProvider();
    const result = this.evaluate(now);

    if (result.shouldNotify) {
      this.store.updateReminderMeta({
        lastNotifiedDate: result.today,
        lastNotifiedAt: now.toISOString(),
        snoozedUntil: null
      });
      this.onNotify(result);
    }

    const updated = this.evaluate(now);
    const sig = JSON.stringify({
      status: updated.status,
      today: updated.today,
      minutesUntilTarget: updated.minutesUntilTarget,
      snoozeMinutesLeft: updated.snoozeMinutesLeft || 0,
      reminderTime: updated.reminderTime
    });
    if (sig !== this.lastStatusSignature) {
      this.lastStatusSignature = sig;
      this.onStatusChange(updated);
    }
    return updated;
  }

  snooze(minutes = 30) {
    const now = this.nowProvider();
    const until = new Date(now.getTime() + minutes * 60000);
    this.store.updateReminderMeta({
      lastNotifiedDate: null,
      snoozedUntil: until.toISOString()
    });
    return this.tick();
  }

  start(intervalMs = 30000) {
    this.stop();
    this.tick();
    this.timer = setInterval(() => this.tick(), intervalMs);
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

module.exports = {
  NightReminderScheduler,
  getLocalDateKey,
  getReminderTargetDate
};
