const { contextBridge, ipcRenderer } = require('electron')

console.log(ipcRenderer)

contextBridge.exposeInMainWorld('electronAPI', {
    onLogin: (handler) => ipcRenderer.on('login', handler),
    confirmLogin: () => ipcRenderer.send('confirm-login'),
    denyLogin: () => ipcRenderer.send('deny-login')
})

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer)