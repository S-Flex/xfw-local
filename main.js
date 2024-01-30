"use strict";

const { app, BrowserWindow, ipcMain, Tray, nativeTheme, dialog, globalShortcut } = require("electron");

if (require("electron-squirrel-startup")) return;

const path = require("path");

const cors = require("cors");

const express = require("express");
const server = express();
const port = 4322;

const auth = require("./auth");
const logs = require("./logs");

const fs = require("fs").promises;

auth.loadCredentials();
logs.loadLogs();

server.use(express.json({ limit: "10gb" }));
server.use(cors({
    origin: (domain, callback) => {
        callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"]
}));

if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require("child_process");
    const path = require("path");

    const appFolder = path.resolve(process.execPath, "..");
    const rootAtomFolder = path.resolve(appFolder, "..");
    const updateDotExe = path.resolve(path.join(rootAtomFolder, "Update.exe"));
    const exeName = path.basename(process.execPath);

    const spawn = function (command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {
                detached: true,
            });
        } catch (error) {}

        return spawnedProcess;
    };

    const spawnUpdate = function (args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case "--squirrel-install":
        case "--squirrel-updated":
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(["--createShortcut", exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case "--squirrel-uninstall":
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(["--removeShortcut", exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case "--squirrel-obsolete":
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            app.quit();
            return true;
    }
}

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

const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));

// Setup Electron window
const createWindow = async () => {
    if (win) {
        win.close();
        await timeout(300);
    }
    
    const window = new BrowserWindow({
        icon: "./icon/sflex_logo.png",
        height: 600,
        width: 400,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
        },
    });

    window.menuBarVisible = false;

    await window.loadFile("view/index.html");

    win = window;

    logs.setWindow(window);

    if (app.dock && app.dock.show) app.dock.show();

    win.once("closed", () => {
        if (app.dock && app.dock.hide) app.dock.hide();
    });

    win.on('show', () => {
        let toFrontTries = 20;
        const interval = setInterval(() => {

            if (toFrontTries <= 0) {
                clearInterval(interval);
                return;
            }

            window.focus();
            toFrontTries--;

        }, 100);
    });
    
};

app.whenReady().then(() => {
    if (app.dock && app.dock.hide) app.dock.hide();

    let path = "/icon/sflex_logo_trayTemplate.png"

    // if os is windows and system theme is dark use light icons
    if (process.platform === "win32" && nativeTheme.shouldUseDarkColors) {
        path = "/icon/sflex_logo_tray_light.png"
    }

    // Naam moet met template eindigen voor macos zodat macos automatisch de kleueren aanpast.
    tray = new Tray(__dirname + path);

    tray.setToolTip("xfw-local");

    tray.on("click", () => {
        createWindow();
    });

    // check if there is a new version available
    const currentVersion = fs.readFile(__dirname + '/version.txt', 'utf-8');

    currentVersion.then((version) => {
        console.log('current version: ' + version)

        fetch('https://node-red.sflex.nl/xfw-local-latest').then((response) => {
            response.text().then((latestVersion) => {
                if(version != latestVersion) {
                    dialog.showMessageBox(win, {
                        type: 'info',
                        buttons: ['Downloaden', 'App afsluiten'],
                        defaultId: 0,
                        title: 'Xfw-local: Nieuwe versie beschikbaar, download alstublieft de laatste versie. Deze versie van de app wordt niet langer ondersteund.',
                        message: 'Er is een nieuwe versie beschikbaar!',
                        detail: 'Huidige versie: ' + version + ' Laatste versie: ' + latestVersion,
                        cancelId: 1,
                        noLink: false,
                        normalizeAccessKeys: false
                    }).then((response) => {
                        const os = process.platform === 'darwin' ? 'macos' : 'windows';
                        const arch = process.arch;

                        const fileName = 'xfw-local-latest-' + os + '-' + arch + (os === 'macos' ? '.dmg' : '.exe');

                        if(response.response == 0) {
                            require('electron').shell.openExternal('https://f003.backblazeb2.com/file/xfw-local/' + fileName);
                            app.quit();
                        } else {
                            app.quit();
                        }
                    }).catch(() => app.quit());
                }
            })
        })
    });
});

app.on("window-all-closed", () => {
    win = null;
});

ipcMain.on("exit", () => {
    app.quit();
});

// Auth
ipcMain.on("login-status", () => {
    if (auth.confirmed) {
        win.webContents.send("login-status", {
            url: auth.url,
            sessionObject: auth.sessionObject,
        });
    }
});

server.get("/auth", async (req, res) => {
    
    // get http param url
    const url = req.query.url;
    const token = req.query.token;
    
    if (auth.confirmed && await auth.checkIfSameAccount(token)) {
        res.status(200).send(
            "App already logged in to a session. Please log out first if you want to log in to a new session."
        );
        return;
    }

    try {
        await createWindow();

        await auth.login(url, token);

        win.webContents.send("login", {
            url: auth.url,
            sessionObject: auth.sessionObject,
        });
    } catch (e) {
        console.error("False login");
        return;
    }

    ipcMain.once("confirm-login", (e, arg) => {
       
        auth.confirmLogin();

        if(arg[0]) {
            auth.storeCredentials();
        } else {
            auth.clearCredentials();
        }

        if (!res.headersSent) res.send("ok");
    });

    ipcMain.once("deny-login", () => {
        auth.denyLogin();

        logs.logs = [];

        if (!res.headersSent) res.status(403).send("not ok");
    });
});

ipcMain.on('logout', () => {
    auth.clearCredentials();
    auth.denyLogin();

    logs.logs = [];
})

// File requests
const fileRequests = require("./fileRequests");
const { time } = require("console");
server.use("", fileRequests);

ipcMain.on("get-all-logs", (event) => {
    win.webContents.send("all-logs", logs.getAllLogs());
});

// Dev hot reload setup
// try {
//    require("electron-reloader")(module);
// } catch (_) {}

// auto start-up on boot
const appFolder = path.dirname(process.execPath);
const updateExe = path.resolve(appFolder, "..", "Update.exe");
const exeName = path.basename(process.execPath);

app.setLoginItemSettings({
    openAtLogin: true,
    path: process.platform === "win32" ? updateExe : appFolder,
    args: [
        "--processStart",
        `"${exeName}"`,
        "--process-start-args",
        '"--hidden"',
    ],
});


app.on('browser-window-focus', () => {
    globalShortcut.unregister('F5');
    globalShortcut.unregister('CommandOrControl+R');
})