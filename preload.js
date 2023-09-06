const { contextBridge, ipcRenderer } = require('electron')

console.log(ipcRenderer)

contextBridge.exposeInMainWorld('electronAPI', {
    onLogin: (handler) => ipcRenderer.on('login', handler),
    confirmLogin: () => ipcRenderer.send('confirm-login'),
    denyLogin: () => ipcRenderer.send('deny-login'),
    onLoginStatus: (handler) => ipcRenderer.on('login-status', handler),
    loginStatus: () => ipcRenderer.send('login-status'),
    exit: () => ipcRenderer.send('exit'),
    onLog: (handler) => ipcRenderer.on('log', handler),
    getAllLogs: () => ipcRenderer.send('get-all-logs'),
    allLogs: (handler) => ipcRenderer.on('all-logs', handler),
})

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer)