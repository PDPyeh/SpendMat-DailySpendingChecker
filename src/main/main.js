const path = require('path');
const fs = require('fs');
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  ipcMain,
  dialog,
  shell,
  nativeImage
} = require('electron');
const { SpendingStore } = require('./store');
const { NightReminderScheduler, getLocalDateKey } = require('./scheduler');

app.setAppUserModelId('com.spendmat.daily');

let mainWindow = null;
let tray = null;
let store = null;
let scheduler = null;
let isQuitting = false;
let hasShownTrayNotice = false;

function resolveAssetPath(fileName) {
  const unpackedPath = path.join(process.resourcesPath || '', 'app.asar.unpacked', 'assets', fileName);
  if (app.isPackaged && fs.existsSync(unpackedPath)) {
    return unpackedPath;
  }
  return path.join(__dirname, '..', '..', 'assets', fileName);
}

function loadIcon(fileName) {
  const filePath = resolveAssetPath(fileName);
  if (fs.existsSync(filePath)) {
    return nativeImage.createFromPath(filePath);
  }
  return nativeImage.createEmpty();
}

function formatMoneySimple(amount, settings) {
  const decimals = Number.isInteger(settings.currencyDecimals) ? settings.currencyDecimals : 2;
  const formatted = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${settings.currencySymbol}${formatted}`;
}

function showWindowAndFocus(focusQuickAdd = false) {
  if (!mainWindow) {
    createWindow();
  }
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
  if (focusQuickAdd) {
    mainWindow.webContents.send('app:focus-quick-add');
  }
}

function sendDesktopNotification({ title, body, isTest = false }) {
  if (!Notification.isSupported()) {
    return { supported: false, message: 'Desktop notifications are not supported on this system.' };
  }
  const notification = new Notification({
    title,
    body,
    icon: loadIcon('icon.png'),
    silent: false
  });

  notification.on('click', () => {
    showWindowAndFocus(true);
  });

  notification.show();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('reminder:triggered', {
      title,
      body,
      isTest,
      triggeredAt: new Date().toISOString()
    });
  }
  return { supported: true };
}

function refreshTray(reminderStatus) {
  if (!tray || !store) return;
  const state = store.getState();
  const today = getLocalDateKey(new Date());
  const todayTotal = store.getTotalForDate(today);
  const status = reminderStatus || scheduler.evaluate();

  let statusLine = `Today: ${formatMoneySimple(todayTotal, state.settings)}`;
  if (status.isNoSpendDay) {
    statusLine = 'Today: Stamped $0 No-Spend';
  } else if (status.status === 'armed') {
    statusLine = `No entries yet. Night check at ${status.reminderTime}`;
  } else if (status.status === 'overdue' || status.status === 'notified') {
    statusLine = `Action needed: log today's spending`;
  } else if (status.status === 'snoozed') {
    statusLine = `Reminder snoozed (${status.snoozeMinutesLeft}m left)`;
  }

  tray.setToolTip(`SpendMat: ${statusLine}`);

  const menu = Menu.buildFromTemplate([
    { label: 'Open SpendMat Desk', click: () => showWindowAndFocus(false) },
    { label: 'Quick Add Spending', click: () => showWindowAndFocus(true) },
    { type: 'separator' },
    { label: statusLine, enabled: false },
    {
      label: 'Stamp Today as No-Spend ($0)',
      enabled: status.entryCountToday === 0 && !status.isNoSpendDay,
      click: () => {
        try {
          store.toggleNoSpendDay(today, true);
          const nextStatus = scheduler.tick();
          refreshTray(nextStatus);
          broadcastState(nextStatus);
        } catch {
          showWindowAndFocus(false);
        }
      }
    },
    {
      label: 'Snooze Night Reminder (30 min)',
      enabled: !status.hasLoggedToday && state.settings.reminderEnabled,
      click: () => {
        const nextStatus = scheduler.snooze(30);
        refreshTray(nextStatus);
        broadcastState(nextStatus);
      }
    },
    {
      label: 'Send Test Notification',
      click: () => {
        sendDesktopNotification({
          title: 'SpendMat Night Check (Test)',
          body: 'Automatic night reminders are working. Click to open your spending desk.',
          isTest: true
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit SpendMat',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
}

function broadcastState(reminderStatus) {
  if (!mainWindow || mainWindow.isDestroyed() || !store || !scheduler) return;
  mainWindow.webContents.send('state:updated', {
    state: store.getState(),
    reminderStatus: reminderStatus || scheduler.evaluate()
  });
}

function createTray() {
  if (tray) return;
  tray = new Tray(loadIcon('tray-icon.png'));
  tray.on('click', () => showWindowAndFocus(false));
  tray.on('double-click', () => showWindowAndFocus(false));
  refreshTray();
}

function createWindow() {
  const settings = store.getState().settings;
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 440,
    minHeight: 580,
    title: 'SpendMat - Daily Spending Desk',
    icon: loadIcon('icon.png'),
    backgroundColor: settings.theme === 'night' ? '#0B2242' : '#126CE2',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    const currentSettings = store.getState().settings;
    if (!isQuitting && currentSettings.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
      if (!hasShownTrayNotice && Notification.isSupported()) {
        hasShownTrayNotice = true;
        new Notification({
          title: 'SpendMat is running in your tray',
          body: `Your automatic ${currentSettings.reminderTime} night reminder stays active in the background.`,
          icon: loadIcon('icon.png')
        }).show();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function safeHandle(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      const data = await handler(event, ...args);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : 'Unexpected desktop error.' };
    }
  });
}

function registerIpc() {
  safeHandle('state:get', () => {
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return {
      state: store.getState(),
      reminderStatus,
      notificationsSupported: Notification.isSupported(),
      loadWarning: store.lastLoadError || null
    };
  });

  safeHandle('entry:add', (_event, payload) => {
    const entry = store.addEntry(payload);
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return { entry, state: store.getState(), reminderStatus };
  });

  safeHandle('entry:update', (_event, { id, patch }) => {
    const entry = store.updateEntry(id, patch);
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return { entry, state: store.getState(), reminderStatus };
  });

  safeHandle('entry:delete', (_event, { id }) => {
    store.deleteEntry(id);
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return { state: store.getState(), reminderStatus };
  });

  safeHandle('nospend:toggle', (_event, { date, forceValue }) => {
    const marked = store.toggleNoSpendDay(date, forceValue);
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return { marked, state: store.getState(), reminderStatus };
  });

  safeHandle('settings:update', (_event, patch) => {
    const settings = store.updateSettings(patch);
    if (patch && patch.launchAtLogin !== undefined) {
      try {
        app.setLoginItemSettings({ openAtLogin: Boolean(settings.launchAtLogin) });
      } catch {
        // Ignore on unsupported dev environments
      }
    }
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return { settings, state: store.getState(), reminderStatus };
  });

  safeHandle('reminder:test', () => {
    const result = sendDesktopNotification({
      title: 'SpendMat: Night Spending Check (Test)',
      body: 'You have not logged spending for today yet. Click to open your notebook sheet.',
      isTest: true
    });
    if (!result.supported) {
      throw new Error(result.message);
    }
    return { sentAt: new Date().toISOString() };
  });

  safeHandle('reminder:snooze', (_event, { minutes }) => {
    const reminderStatus = scheduler.snooze(Number(minutes) || 30);
    refreshTray(reminderStatus);
    return { state: store.getState(), reminderStatus };
  });

  safeHandle('data:export-csv', async () => {
    const today = getLocalDateKey(new Date());
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Daily Spending CSV',
      defaultPath: `spendmat-export-${today}.csv`,
      filters: [{ name: 'CSV Spreadsheet', extensions: ['csv'] }]
    });
    if (canceled || !filePath) {
      return { canceled: true };
    }
    fs.writeFileSync(filePath, store.exportCsv(), 'utf8');
    return { canceled: false, filePath };
  });

  safeHandle('data:export-backup', async () => {
    const today = getLocalDateKey(new Date());
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save SpendMat JSON Backup',
      defaultPath: `spendmat-backup-${today}.json`,
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    });
    if (canceled || !filePath) {
      return { canceled: true };
    }
    fs.writeFileSync(filePath, store.exportBackupJson(), 'utf8');
    return { canceled: false, filePath };
  });

  safeHandle('data:import-backup', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import SpendMat JSON Backup',
      properties: ['openFile'],
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return { canceled: true };
    }
    const raw = fs.readFileSync(filePaths[0], 'utf8');
    const state = store.importBackupJson(raw);
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return { canceled: false, state, reminderStatus };
  });

  safeHandle('data:open-folder', async () => {
    const errText = await shell.openPath(store.dataDir);
    if (errText) {
      throw new Error(errText);
    }
    return { opened: store.dataDir };
  });

  safeHandle('data:reset', () => {
    const state = store.resetAllData();
    const reminderStatus = scheduler.tick();
    refreshTray(reminderStatus);
    return { state, reminderStatus };
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showWindowAndFocus(false);
  });

  app.whenReady().then(() => {
    const dataDir = path.join(app.getPath('userData'), 'spendmat-data');
    store = new SpendingStore(dataDir);
    scheduler = new NightReminderScheduler({
      store,
      onNotify: (result) => {
        sendDesktopNotification({
          title: 'SpendMat: Forgot to log today?',
          body: `It is past ${result.reminderTime} and today has no spending logged. Click to add an entry or stamp a $0 no-spend day.`,
          isTest: false
        });
      },
      onStatusChange: (status) => {
        refreshTray(status);
        broadcastState(status);
      }
    });

    registerIpc();
    createTray();
    createWindow();
    scheduler.start(30000);
  });

  app.on('before-quit', () => {
    isQuitting = true;
    if (scheduler) {
      scheduler.stop();
    }
  });

  app.on('window-all-closed', () => {
    const minimize = store && store.getState().settings.minimizeToTray;
    if (!minimize && process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    showWindowAndFocus(false);
  });
}
