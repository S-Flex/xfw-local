'use strict';

const { app, BrowserWindow, ipcMain, Tray, nativeImage } = require("electron");
const path = require("path");
const express = require("express");
const server = express();
const port = 4322;

const auth = require("./auth");
const logs = require("./logs");

server.use(express.json({ limit: "10gb" }));

// Setup Express server
server.use((req, res, next) => {
    // Only allow localhost to access the server
    const remoteIp = req.ip;
    const localIps = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];

    if (localIps.includes(remoteIp)) {
        next();
    } else {
        res.status(403).send("Forbidden");
    }
});

server.listen(port);

// Setup Electron tray icon
let tray = null;

let win = null;

// Setup Electron window
const createWindow = async () => {
    if(win) {
        win.close();
    }

    const window = new BrowserWindow({
        height: 600,
        width: 400,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });

    await window.loadFile("view/index.html");

    win = window;

    logs.setWindow(window);
};

app.whenReady().then(() => {
    app.dock.hide();

    tray = new Tray(__dirname + '/icon/sflex_logo_tray.png');

    tray.setToolTip('This is my application.')

    tray.on('click', () => {
        createWindow();
    });
});

app.on("window-all-closed", () => {
    win = null;
});

ipcMain.on('exit', () => {
    app.quit();
});

// Auth
ipcMain.on('login-status', () => {
    if(auth.confirmed) {
        win.webContents.send('login-status', { url: auth.url, sessionObject: auth.sessionObject })
    }
})

server.get("/auth", async (req, res) => {
    if(auth.confirmed) {
        res.status(409).send('App already logged in to a session. Please log out first if you want to log in to a new session.');
        return;
    }

    // get http param url
    const url = req.query.url;
    const token = req.query.token;

    try {
        await createWindow();

        await auth.login(url, token);

        win.webContents.send('login', { url: auth.url, sessionObject: auth.sessionObject });

    }   catch(e) {
        console.error('False login')
        return;
    }

    ipcMain.once('confirm-login', () => {
        auth.confirmLogin();

        if(!res.headersSent)
            res.send('ok');
    });

    ipcMain.once('deny-login', () => {
        auth.denyLogin();

        logs.logs = [];

        if(!res.headersSent)
            res.status(403).send('not ok')
    });
});

// File requests
const fileRequests = require('./fileRequests');
server.use('', fileRequests);

ipcMain.on('get-all-logs', (event) => {
    win.webContents.send('all-logs', logs.getAllLogs());
});

// Dev hot reload setup
// try {
//    require("electron-reloader")(module);
// } catch (_) {}
