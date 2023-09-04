'use strict';

const { readdir, readFile } = require('fs/promises');

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const express = require("express");
const server = express();
const port = 4322;

const auth = require("./auth");

server.use(express.json());

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

// Setup Electron window
const createWindow = () => {
    const win = new BrowserWindow({
        height: 600,
        width: 400,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });

    win.loadFile("view/index.html");

    server.get("/auth", async (req, res) => {

        // get http param url
        const url = req.query.url;
        const token = req.query.token;

        try {
            await auth.login(token);

            console.log('Login successfull')
            win.webContents.send('login', { url: url, sessionObject: auth.sessionObject });

            if(win.isMinimized()) {
                win.maximize();
            } else {
                win.focus();
            }

        }   catch(e) {
            console.error('False login')
            return;
        }

        res.send('ok')
    });

    server.post('/ls', auth.auth, async (req, res) => {
        const directory = req.body.path;

        const result = await readdir(directory, { withFileTypes: true, recursive: true });

        // Add is directory attribute
        result.map((item) => {
            item.isFile = item.isFile()
        });

        res.json(result);
    });

    // Returns file in base64
    server.post('/getFile', auth.auth, async (req, res) => {
        const path = req.body.path;

        const result = await readFile(path);

        console.log(result)

        res.send({
            "fileName": path.substr(path.lastIndexOf('/')+1),
            "fileBase64": result.toString('base64')
        })
    });

    server.post('/moveFile', auth.auth, async (req, res) => {});
    server.post('/deleteFile', auth.auth, async (req, res) => {});
    server.post('/downloadFile', auth.auth, async (req, res) => {});
    server.post('/createFolder', auth.auth, async (req, res) => {});
    server.post('/deleteFolder', auth.auth, async (req, res) => {});

};



ipcMain.on('confirm-login', () => {
    auth.confirmLogin();
});

ipcMain.on('deny-login', () => {
    auth.denyLogin();
});


app.whenReady().then(() => {
    createWindow();
});

// TODO Make default behaviour to keep running in background when window is closed, only quit when app is in development mode
app.on("window-all-closed", () => {
    app.quit();
});

// Dev hot reload setup
//try {
//    require("electron-reloader")(module);
//} catch (_) {}
