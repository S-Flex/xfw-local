const { contextBridge, ipcRenderer } = require('electron')

console.log(ipcRenderer)

contextBridge.exposeInMainWorld('electronAPI', {
    onLogin: (handler) => ipcRenderer.on('login', handler),
    confirmLogin: () => ipcRenderer.send('confirm-login'),
    denyLogin: () => ipcRenderer.send('deny-login'),
    onLoginStatus: (handler) => ipcRenderer.on('login-status', handler),
    loginStatus: () => ipcRenderer.send('login-status'),
    exit: () => ipcRenderer.send('exit')
})

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer)