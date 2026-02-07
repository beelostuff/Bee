const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('beeAPI', {
  startBot: () => ipcRenderer.invoke('bot-start'),
  stopBot: () => ipcRenderer.invoke('bot-stop'),
  getBotStatus: () => ipcRenderer.invoke('bot-status'),
  updateBot: () => ipcRenderer.invoke('bot-update'),
  onBotLog: callback => ipcRenderer.on('bot-log', (_e, data) => callback(data)),
  onBotStatus: callback => ipcRenderer.on('bot-status', (_e, status) => callback(status))
})