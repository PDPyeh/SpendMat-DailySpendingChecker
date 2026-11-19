(() => {
  const isAndroid = Boolean(window.AndroidSpendBridge);
  window.SpendPlatform = isAndroid ? 'android' : 'desktop';
  document.documentElement.setAttribute('data-platform', window.SpendPlatform);

  if (window.spendApi) {
    return;
  }

  if (!isAndroid) {
    return;
  }

  const stateListeners = new Set();
  const reminderListeners = new Set();
  const focusListeners = new Set();

  let pendingImportResolver = null;
  let pendingExportResolver = null;

  window.__onAndroidStateUpdated = (jsonText) => {
    try {
      const payload = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
      stateListeners.forEach((cb) => cb(payload));
    } catch {
      // Ignore malformed native push
    }
  };

  window.__onAndroidReminderTriggered = (jsonText) => {
    try {
      const payload = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
      reminderListeners.forEach((cb) => cb(payload));
    } catch {
      // Ignore malformed native push
    }
  };

  window.__onAndroidFocusQuickAdd = () => {
    focusListeners.forEach((cb) => cb());
  };

  window.__resolveAndroidImport = (jsonText) => {
    if (!pendingImportResolver) return;
    const resolve = pendingImportResolver;
    pendingImportResolver = null;
    try {
      resolve(JSON.parse(jsonText));
    } catch (err) {
      resolve({ ok: false, error: err && err.message ? err.message : 'Failed to import backup.' });
    }
  };

  window.__resolveAndroidExport = (jsonText) => {
    if (!pendingExportResolver) return;
    const resolve = pendingExportResolver;
    pendingExportResolver = null;
    try {
      resolve(JSON.parse(jsonText));
    } catch (err) {
      resolve({ ok: false, error: err && err.message ? err.message : 'Failed to save file.' });
    }
  };

  function callNative(methodName, payload) {
    return Promise.resolve().then(() => {
      try {
        const raw = payload === undefined
          ? window.AndroidSpendBridge[methodName]()
          : window.AndroidSpendBridge[methodName](JSON.stringify(payload));
        return JSON.parse(raw);
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : 'Android bridge error.' };
      }
    });
  }

  window.spendApi = {
    getState: () => callNative('getState'),
    addEntry: (payload) => callNative('addEntry', payload),
    updateEntry: (id, patch) => callNative('updateEntry', { id, patch }),
    deleteEntry: (id) => callNative('deleteEntry', { id }),
    toggleNoSpendDay: (date, forceValue) => callNative('toggleNoSpendDay', { date, forceValue }),
    updateSettings: (patch) => callNative('updateSettings', patch),
    testReminder: () => callNative('testReminder'),
    snoozeReminder: (minutes) => callNative('snoozeReminder', { minutes }),
    requestNotificationPermission: () => callNative('requestNotificationPermission'),
    exportCsv: () => new Promise((resolve) => {
      pendingExportResolver = resolve;
      window.AndroidSpendBridge.exportCsv();
    }),
    exportBackup: () => new Promise((resolve) => {
      pendingExportResolver = resolve;
      window.AndroidSpendBridge.exportBackup();
    }),
    importBackup: () => new Promise((resolve) => {
      pendingImportResolver = resolve;
      window.AndroidSpendBridge.importBackup();
    }),
    openDataFolder: () => callNative('openDataFolder'),
    resetAllData: () => callNative('resetAllData'),
    onStateUpdated: (callback) => {
      stateListeners.add(callback);
      return () => stateListeners.delete(callback);
    },
    onReminderTriggered: (callback) => {
      reminderListeners.add(callback);
      return () => reminderListeners.delete(callback);
    },
    onFocusQuickAdd: (callback) => {
      focusListeners.add(callback);
      return () => focusListeners.delete(callback);
    }
  };
})();
