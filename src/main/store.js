const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_CATEGORIES = [
  'Food & Drink',
  'Transport',
  'Groceries',
  'Bills & Utilities',
  'Shopping',
  'Health',
  'Entertainment',
  'Other'
];

const CURRENCY_PRESETS = [
  { code: 'USD', symbol: '$', decimals: 2, label: 'USD ($)' },
  { code: 'IDR', symbol: 'Rp', decimals: 0, label: 'IDR (Rp)' },
  { code: 'EUR', symbol: '€', decimals: 2, label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', decimals: 2, label: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', decimals: 0, label: 'JPY (¥)' },
  { code: 'SGD', symbol: 'S$', decimals: 2, label: 'SGD (S$)' },
  { code: 'MYR', symbol: 'RM', decimals: 2, label: 'MYR (RM)' }
];

const DEFAULT_SETTINGS = {
  currencyCode: 'USD',
  currencySymbol: '$',
  currencyDecimals: 2,
  dailyBudget: null,
  reminderEnabled: true,
  reminderTime: '21:00',
  repeatEveryMinutes: 0,
  minimizeToTray: true,
  launchAtLogin: false,
  theme: 'day'
};

function createEmptyData() {
  return {
    version: 1,
    entries: [],
    noSpendDays: [],
    settings: { ...DEFAULT_SETTINGS },
    reminderMeta: {
      lastNotifiedDate: null,
      lastNotifiedAt: null,
      snoozedUntil: null
    }
  };
}

function isValidDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeString(value) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function sanitizeAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('Amount must be a number greater than zero.');
  }
  return Math.round(num * 100) / 100;
}

class SpendingStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.filePath = path.join(dataDir, 'spending-data.json');
    this.data = this._load();
  }

  _ensureDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  _load() {
    try {
      this._ensureDir();
      if (!fs.existsSync(this.filePath)) {
        const fresh = createEmptyData();
        this._persist(fresh);
        return fresh;
      }
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return this._normalize(parsed);
    } catch (err) {
      this.lastLoadError = err.message;
      return createEmptyData();
    }
  }

  _normalize(raw) {
    const base = createEmptyData();
    if (!raw || typeof raw !== 'object') {
      return base;
    }

    const entries = Array.isArray(raw.entries)
      ? raw.entries
          .filter((item) => item && typeof item === 'object' && isValidDateKey(item.date))
          .map((item) => ({
            id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
            date: item.date,
            amount: Number.isFinite(Number(item.amount)) && Number(item.amount) > 0
              ? Math.round(Number(item.amount) * 100) / 100
              : 0,
            category: typeof item.category === 'string' && item.category.trim()
              ? item.category.trim()
              : 'Other',
            note: typeof item.note === 'string' ? item.note.trim().slice(0, 140) : '',
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
            updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString()
          }))
          .filter((item) => item.amount > 0)
      : [];

    const noSpendDays = Array.isArray(raw.noSpendDays)
      ? Array.from(new Set(raw.noSpendDays.filter(isValidDateKey)))
      : [];

    const rawSettings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    const settings = {
      ...DEFAULT_SETTINGS,
      currencyCode: typeof rawSettings.currencyCode === 'string' ? rawSettings.currencyCode : DEFAULT_SETTINGS.currencyCode,
      currencySymbol: typeof rawSettings.currencySymbol === 'string' ? rawSettings.currencySymbol : DEFAULT_SETTINGS.currencySymbol,
      currencyDecimals: Number.isInteger(rawSettings.currencyDecimals) ? rawSettings.currencyDecimals : DEFAULT_SETTINGS.currencyDecimals,
      dailyBudget: rawSettings.dailyBudget !== null && rawSettings.dailyBudget !== undefined && Number.isFinite(Number(rawSettings.dailyBudget)) && Number(rawSettings.dailyBudget) > 0
        ? Math.round(Number(rawSettings.dailyBudget) * 100) / 100
        : null,
      reminderEnabled: typeof rawSettings.reminderEnabled === 'boolean' ? rawSettings.reminderEnabled : DEFAULT_SETTINGS.reminderEnabled,
      reminderTime: isValidTimeString(rawSettings.reminderTime) ? rawSettings.reminderTime : DEFAULT_SETTINGS.reminderTime,
      repeatEveryMinutes: [0, 30, 60].includes(Number(rawSettings.repeatEveryMinutes))
        ? Number(rawSettings.repeatEveryMinutes)
        : 0,
      minimizeToTray: typeof rawSettings.minimizeToTray === 'boolean' ? rawSettings.minimizeToTray : DEFAULT_SETTINGS.minimizeToTray,
      launchAtLogin: typeof rawSettings.launchAtLogin === 'boolean' ? rawSettings.launchAtLogin : DEFAULT_SETTINGS.launchAtLogin,
      theme: rawSettings.theme === 'night' ? 'night' : 'day'
    };

    const rawMeta = raw.reminderMeta && typeof raw.reminderMeta === 'object' ? raw.reminderMeta : {};
    const reminderMeta = {
      lastNotifiedDate: isValidDateKey(rawMeta.lastNotifiedDate) ? rawMeta.lastNotifiedDate : null,
      lastNotifiedAt: typeof rawMeta.lastNotifiedAt === 'string' ? rawMeta.lastNotifiedAt : null,
      snoozedUntil: typeof rawMeta.snoozedUntil === 'string' ? rawMeta.snoozedUntil : null
    };

    return {
      version: 1,
      entries,
      noSpendDays,
      settings,
      reminderMeta
    };
  }

  _persist(dataToSave = this.data) {
    this._ensureDir();
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.filePath);
  }

  getState() {
    return {
      entries: [...this.data.entries],
      noSpendDays: [...this.data.noSpendDays],
      settings: { ...this.data.settings },
      reminderMeta: { ...this.data.reminderMeta },
      categories: DEFAULT_CATEGORIES,
      currencyPresets: CURRENCY_PRESETS,
      dataFilePath: this.filePath
    };
  }

  addEntry({ date, amount, category, note }) {
    if (!isValidDateKey(date)) {
      throw new Error('Please choose a valid date.');
    }
    const cleanAmount = sanitizeAmount(amount);
    const cleanCategory = typeof category === 'string' && category.trim() ? category.trim() : 'Other';
    const cleanNote = typeof note === 'string' ? note.trim().slice(0, 140) : '';
    const nowIso = new Date().toISOString();

    const entry = {
      id: crypto.randomUUID(),
      date,
      amount: cleanAmount,
      category: cleanCategory,
      note: cleanNote,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.data.entries.unshift(entry);
    this.data.noSpendDays = this.data.noSpendDays.filter((d) => d !== date);
    this._persist();
    return entry;
  }

  updateEntry(id, { date, amount, category, note }) {
    const idx = this.data.entries.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error('Spending entry was not found.');
    }
    const existing = this.data.entries[idx];
    const nextDate = date !== undefined ? date : existing.date;
    if (!isValidDateKey(nextDate)) {
      throw new Error('Please choose a valid date.');
    }
    const nextAmount = amount !== undefined ? sanitizeAmount(amount) : existing.amount;
    const nextCategory = category !== undefined && String(category).trim()
      ? String(category).trim()
      : existing.category;
    const nextNote = note !== undefined ? String(note).trim().slice(0, 140) : existing.note;

    const updated = {
      ...existing,
      date: nextDate,
      amount: nextAmount,
      category: nextCategory,
      note: nextNote,
      updatedAt: new Date().toISOString()
    };

    this.data.entries[idx] = updated;
    this.data.noSpendDays = this.data.noSpendDays.filter((d) => d !== nextDate);
    this._persist();
    return updated;
  }

  deleteEntry(id) {
    const before = this.data.entries.length;
    this.data.entries = this.data.entries.filter((item) => item.id !== id);
    if (this.data.entries.length === before) {
      throw new Error('Spending entry was not found.');
    }
    this._persist();
    return true;
  }

  toggleNoSpendDay(date, forceValue) {
    if (!isValidDateKey(date)) {
      throw new Error('Please choose a valid date.');
    }
    const hasEntries = this.data.entries.some((item) => item.date === date);
    if (hasEntries) {
      throw new Error('Delete entries for this day before stamping it as a no-spend day.');
    }
    const exists = this.data.noSpendDays.includes(date);
    const shouldMark = typeof forceValue === 'boolean' ? forceValue : !exists;
    if (shouldMark && !exists) {
      this.data.noSpendDays.push(date);
    } else if (!shouldMark && exists) {
      this.data.noSpendDays = this.data.noSpendDays.filter((d) => d !== date);
    }
    this._persist();
    return shouldMark;
  }

  hasInputForDate(date) {
    return (
      this.data.entries.some((item) => item.date === date) ||
      this.data.noSpendDays.includes(date)
    );
  }

  getTotalForDate(date) {
    const sum = this.data.entries
      .filter((item) => item.date === date)
      .reduce((acc, item) => acc + item.amount, 0);
    return Math.round(sum * 100) / 100;
  }

  updateSettings(patch) {
    if (!patch || typeof patch !== 'object') {
      throw new Error('Settings update must be an object.');
    }
    const next = { ...this.data.settings };

    if (patch.currencyCode !== undefined) {
      const preset = CURRENCY_PRESETS.find((c) => c.code === patch.currencyCode);
      if (preset) {
        next.currencyCode = preset.code;
        next.currencySymbol = preset.symbol;
        next.currencyDecimals = preset.decimals;
      }
    }
    if (patch.dailyBudget !== undefined) {
      if (patch.dailyBudget === null || patch.dailyBudget === '') {
        next.dailyBudget = null;
      } else {
        const val = Number(patch.dailyBudget);
        if (!Number.isFinite(val) || val <= 0) {
          throw new Error('Daily budget must be empty or a positive number.');
        }
        next.dailyBudget = Math.round(val * 100) / 100;
      }
    }
    if (patch.reminderEnabled !== undefined) {
      next.reminderEnabled = Boolean(patch.reminderEnabled);
    }
    if (patch.reminderTime !== undefined) {
      if (!isValidTimeString(patch.reminderTime)) {
        throw new Error('Reminder time must use 24-hour HH:MM format.');
      }
      next.reminderTime = patch.reminderTime;
    }
    if (patch.repeatEveryMinutes !== undefined) {
      const rep = Number(patch.repeatEveryMinutes);
      if (![0, 30, 60].includes(rep)) {
        throw new Error('Repeat interval must be 0, 30, or 60 minutes.');
      }
      next.repeatEveryMinutes = rep;
    }
    if (patch.minimizeToTray !== undefined) {
      next.minimizeToTray = Boolean(patch.minimizeToTray);
    }
    if (patch.launchAtLogin !== undefined) {
      next.launchAtLogin = Boolean(patch.launchAtLogin);
    }
    if (patch.theme !== undefined) {
      next.theme = patch.theme === 'night' ? 'night' : 'day';
    }

    this.data.settings = next;
    this._persist();
    return { ...this.data.settings };
  }

  updateReminderMeta(patch) {
    this.data.reminderMeta = {
      ...this.data.reminderMeta,
      ...patch
    };
    this._persist();
    return { ...this.data.reminderMeta };
  }

  exportCsv() {
    const header = ['Date', 'Category', 'Note', 'Amount', 'Currency', 'Recorded At'];
    const escapeCell = (val) => {
      const str = String(val ?? '');
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = [...this.data.entries]
      .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : b.date.localeCompare(a.date)))
      .map((entry) => [
        entry.date,
        entry.category,
        entry.note,
        entry.amount.toFixed(this.data.settings.currencyDecimals),
        this.data.settings.currencyCode,
        entry.createdAt
      ]);
    return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  }

  exportBackupJson() {
    return JSON.stringify(this.data, null, 2);
  }

  importBackupJson(rawText) {
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error('Backup file is not valid JSON.');
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
      throw new Error('Backup file is missing spending entries.');
    }
    this.data = this._normalize(parsed);
    this._persist();
    return this.getState();
  }

  resetAllData() {
    const currentSettings = { ...this.data.settings };
    this.data = createEmptyData();
    this.data.settings = currentSettings;
    this._persist();
    return this.getState();
  }
}

module.exports = {
  SpendingStore,
  DEFAULT_CATEGORIES,
  CURRENCY_PRESETS,
  DEFAULT_SETTINGS,
  isValidDateKey,
  isValidTimeString
};
