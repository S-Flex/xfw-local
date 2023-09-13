"use strict";

const { app, BrowserWindow, ipcMain, Tray, nativeImage } = require("electron");

if (require("electron-squirrel-startup")) return;

const path = require("path");
const express = require("express");
const server = express();
const port = 4322;

const auth = require("./auth");
const logs = require("./logs");

server.use(express.json({ limit: "10gb" }));

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

// Setup Electron window
const createWindow = async () => {
    if (win) {
        win.close();
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
};

app.whenReady().then(() => {
    if (app.dock && app.dock.hide) app.dock.hide();

    tray = new Tray(__dirname + "/icon/sflex_logo_tray.png");

    tray.setToolTip("xfw-local");

    tray.on("click", () => {
        createWindow();
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
    if (auth.confirmed) {
        res.status(409).send(
            "App already logged in to a session. Please log out first if you want to log in to a new session."
        );
        return;
    }

    // get http param url
    const url = req.query.url;
    const token = req.query.token;

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

    ipcMain.once("confirm-login", () => {
        auth.confirmLogin();

        if (!res.headersSent) res.send("ok");
    });

    ipcMain.once("deny-login", () => {
        auth.denyLogin();

        logs.logs = [];

        if (!res.headersSent) res.status(403).send("not ok");
    });
});

// File requests
const fileRequests = require("./fileRequests");
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
