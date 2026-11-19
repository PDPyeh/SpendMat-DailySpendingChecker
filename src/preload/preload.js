const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spendApi', {
  getState: () => ipcRenderer.invoke('state:get'),
  addEntry: (payload) => ipcRenderer.invoke('entry:add', payload),
  updateEntry: (id, patch) => ipcRenderer.invoke('entry:update', { id, patch }),
  deleteEntry: (id) => ipcRenderer.invoke('entry:delete', { id }),
  toggleNoSpendDay: (date, forceValue) => ipcRenderer.invoke('nospend:toggle', { date, forceValue }),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  testReminder: () => ipcRenderer.invoke('reminder:test'),
  snoozeReminder: (minutes) => ipcRenderer.invoke('reminder:snooze', { minutes }),
  exportCsv: () => ipcRenderer.invoke('data:export-csv'),
  exportBackup: () => ipcRenderer.invoke('data:export-backup'),
  importBackup: () => ipcRenderer.invoke('data:import-backup'),
  openDataFolder: () => ipcRenderer.invoke('data:open-folder'),
  resetAllData: () => ipcRenderer.invoke('data:reset'),
  onStateUpdated: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('state:updated', listener);
    return () => ipcRenderer.removeListener('state:updated', listener);
  },
  onReminderTriggered: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('reminder:triggered', listener);
    return () => ipcRenderer.removeListener('reminder:triggered', listener);
  },
  onFocusQuickAdd: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:focus-quick-add', listener);
    return () => ipcRenderer.removeListener('app:focus-quick-add', listener);
  }
});
