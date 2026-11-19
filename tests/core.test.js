const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { SpendingStore } = require('../src/main/store');
const { NightReminderScheduler, getLocalDateKey } = require('../src/main/scheduler');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spendmat-test-'));
}

test('SpendingStore calculates daily totals and persists across reloads', () => {
  const dir = createTempDir();
  try {
    const store = new SpendingStore(dir);
    assert.equal(store.getTotalForDate('2026-11-19'), 0);

    const e1 = store.addEntry({ date: '2026-11-19', amount: 12.5, category: 'Food & Drink', note: 'Lunch' });
    store.addEntry({ date: '2026-11-19', amount: 4.25, category: 'Transport', note: 'Bus' });
    assert.equal(store.getTotalForDate('2026-11-19'), 16.75);

    store.updateEntry(e1.id, { amount: 15, note: 'Lunch + tea' });
    assert.equal(store.getTotalForDate('2026-11-19'), 19.25);

    const reloaded = new SpendingStore(dir);
    assert.equal(reloaded.getTotalForDate('2026-11-19'), 19.25);
    assert.equal(reloaded.getState().entries.length, 2);

    reloaded.deleteEntry(e1.id);
    assert.equal(reloaded.getTotalForDate('2026-11-19'), 4.25);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('SpendingStore no-spend stamp clears automatically when an entry is added', () => {
  const dir = createTempDir();
  try {
    const store = new SpendingStore(dir);
    assert.equal(store.hasInputForDate('2026-11-19'), false);

    store.toggleNoSpendDay('2026-11-19', true);
    assert.equal(store.hasInputForDate('2026-11-19'), true);

    store.addEntry({ date: '2026-11-19', amount: 5, category: 'Other', note: 'Snack' });
    assert.equal(store.getState().noSpendDays.includes('2026-11-19'), false);
    assert.equal(store.hasInputForDate('2026-11-19'), true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('SpendingStore exports CSV and validates JSON backup import', () => {
  const dir = createTempDir();
  try {
    const store = new SpendingStore(dir);
    store.updateSettings({ currencyCode: 'IDR', dailyBudget: 150000 });
    store.addEntry({ date: '2026-11-19', amount: 35000, category: 'Food & Drink', note: 'Nasi goreng, extra egg' });

    const csv = store.exportCsv();
    assert.match(csv, /^Date,Category,Note,Amount,Currency,Recorded At/);
    assert.match(csv, /"Nasi goreng, extra egg"/);
    assert.match(csv, /35000,IDR/);

    const backup = store.exportBackupJson();
    store.resetAllData();
    assert.equal(store.getState().entries.length, 0);

    store.importBackupJson(backup);
    assert.equal(store.getState().entries.length, 1);
    assert.equal(store.getTotalForDate('2026-11-19'), 35000);

    assert.throws(() => store.importBackupJson('{bad json'), /not valid JSON/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('NightReminderScheduler fires once after reminder time when unlogged and stays quiet if logged or stamped', () => {
  const dir = createTempDir();
  try {
    const store = new SpendingStore(dir);
    store.updateSettings({ reminderEnabled: true, reminderTime: '21:00', repeatEveryMinutes: 0 });

    let currentNow = new Date(2026, 10, 19, 15, 0, 0); // Nov 19, 2026 15:00 local
    const notifications = [];
    const scheduler = new NightReminderScheduler({
      store,
      nowProvider: () => currentNow,
      onNotify: (payload) => notifications.push(payload)
    });

    // Afternoon: armed, does not notify
    let status = scheduler.tick();
    assert.equal(status.status, 'armed');
    assert.equal(notifications.length, 0);

    // Night 21:05: fires once
    currentNow = new Date(2026, 10, 19, 21, 5, 0);
    status = scheduler.tick();
    assert.equal(notifications.length, 1);
    assert.equal(status.status, 'notified');

    // Night 21:20: repeat is 0, does not fire again
    currentNow = new Date(2026, 10, 19, 21, 20, 0);
    status = scheduler.tick();
    assert.equal(notifications.length, 1);

    // Enable repeat every 30 min, advance to 21:40 -> fires second reminder
    store.updateSettings({ repeatEveryMinutes: 30 });
    currentNow = new Date(2026, 10, 19, 21, 40, 0);
    status = scheduler.tick();
    assert.equal(notifications.length, 2);

    // User logs an entry -> status immediately becomes logged
    store.addEntry({ date: getLocalDateKey(currentNow), amount: 8.5, category: 'Food & Drink', note: 'Dinner' });
    status = scheduler.tick();
    assert.equal(status.status, 'logged');
    assert.equal(notifications.length, 2);

    // Next night Nov 20 21:10 -> user stamps $0 no-spend day first -> zero notifications
    currentNow = new Date(2026, 10, 20, 21, 10, 0);
    store.toggleNoSpendDay(getLocalDateKey(currentNow), true);
    status = scheduler.tick();
    assert.equal(status.status, 'logged');
    assert.equal(status.isNoSpendDay, true);
    assert.equal(notifications.length, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('NightReminderScheduler snooze delays reminder and re-fires when snooze expires', () => {
  const dir = createTempDir();
  try {
    const store = new SpendingStore(dir);
    store.updateSettings({ reminderEnabled: true, reminderTime: '21:00', repeatEveryMinutes: 0 });

    let currentNow = new Date(2026, 10, 19, 21, 10, 0);
    const notifications = [];
    const scheduler = new NightReminderScheduler({
      store,
      nowProvider: () => currentNow,
      onNotify: (payload) => notifications.push(payload)
    });

    scheduler.tick();
    assert.equal(notifications.length, 1);

    // Snooze 30 minutes
    let status = scheduler.snooze(30);
    assert.equal(status.status, 'snoozed');

    currentNow = new Date(2026, 10, 19, 21, 25, 0);
    status = scheduler.tick();
    assert.equal(status.status, 'snoozed');
    assert.equal(notifications.length, 1);

    // Past 30 min snooze -> fires again
    currentNow = new Date(2026, 10, 19, 21, 42, 0);
    status = scheduler.tick();
    assert.equal(notifications.length, 2);
    assert.equal(status.status, 'notified');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
