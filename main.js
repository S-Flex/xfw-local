'use strict';

const { readdir, readFile, copyFile, rename, unlink, mkdir } = require('fs/promises');

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

        ipcMain.once('confirm-login', () => {
            auth.confirmLogin();

            if(!res.headersSent)
                res.send('ok');
        });

        ipcMain.once('deny-login', () => {
            auth.denyLogin();

            if(!res.headersSent)
                res.status(403).send('not ok')
        });
    });

    // This request lists all files and directories in a directory
    server.post('/ls', auth.auth, (req, res) => {
        const directory = req.body.path;

        if(!directory) {
            res.status(400).send('Path not provided.')
            return;
        }

        readdir(directory, { withFileTypes: true, recursive: true }).then((result) => {
            // Add is directory attribute
            result.map((item) => {
                item.isFile = item.isFile()
            });
    
            res.json(result);
        }).catch(() => {
            res.status(404).send('Directory does not exist.')
        });

    });

    // This request returns a file from path in base64
    server.post('/getFile', auth.auth, (req, res) => {
        const path = req.body.path;

        if(!path) {
            res.status(400).send('Path not provided.')
            return;
        }

        readFile(path).then(result => {
            res.send({
                "fileName": path.substr(path.lastIndexOf('/')+1),
                "fileBase64": result.toString('base64')
            })
        }).catch(() => {
            res.status(404).send('File does not exist.')
        });
    });

    // This requests is used to rename a file and/or location.
    server.post('/moveFile', auth.auth, (req, res) => {
        const filePath = req.body.path;
        const newLocation = req.body.newLocation;

        if(!filePath || !newLocation) {
            res.status(400).send('Path and/or new location not provided.')
            return;
        }

        rename(filePath, newLocation).then(() => {
            res.send('ok')
        }).catch(() => {
            res.status(400).send('File does not exist. Nothing to rename.')
        })
    });

    // This request is used to duplicate files.
    server.post('/copyFile', auth.auth, (req, res) => {
        const filePath = req.body.path;
        const newLocation = req.body.newFile;

        if(!filePath || !newLocation) {
            res.status(400).send('Path and/or new file name not provided.')
            return;
        }

        copyFile(filePath, newLocation).then(() => {
            res.send('ok')
        }).catch(() => {
            res.status(404).send('File does not exist. No file to copy.');
        })

    });

    // This request is used to unload(delete) a file from the local file system.
    server.post('/deleteFile', auth.auth, (req, res) => {
        const path = req.body.path;

        if(!path) {
            res.status(400).send('Path not provided.')
            return;
        }

        unlink(path).then(() => {
            res.send('ok')
        }).catch(() => {
            res.status(404).send('File does not exist. Nothing to delete.')
        });
    });

    // TODO create uploadFile method
    // This method is used to upload a file to the local file system
    server.post('/downloadFile', auth.auth, (req, res) => {

    });

    // This method is used to create a directory at a specific path
    server.post('/createFolder', auth.auth, (req, res) => {
        const rootPath = req.body.rootPath;
        const newDirName = req.body.newDirName;

        if(!rootPath || !newDirName) {
            res.status(400).send('Root path and/or new directory name not provided.')
            return;
        }

        mkdir(rootPath + '/' + newDirName).then(() => {
            res.send('ok')
        }).catch(() => {
            res.status(404).send('Root path does not exist.')
        });
    });

    // This method is used to delete a directory and optionally all files in it recursively
    server.post('/deleteFolder', auth.auth, async (req, res) => {
        const path = req.body.path;
        const recursive = req.body.recursive;

        if(!path) {
            res.status(400).send('Path not provided.')
            return;
        }

        try {
            if(recursive) {
                await deleteFolderRecursive(path);
            } else {
                await unlink(path);
            }
            res.send('ok')
        } catch(e) {
            res.status(404).send('Directory does not exist.')
        }
    });

};

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
