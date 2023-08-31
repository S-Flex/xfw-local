const { app, BrowserWindow } = require("electron");
const express = require("express");
const server = express();
const port = 4322;

const auth = require("./auth");

// Setup Express server
server.use((req, res, next) => {
    // Only allow localhost to access the server
    const remoteIp = req.ip;
    const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

    if(localIps.includes(remoteIp)) {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
});

server.get('/auth', async (req, res) => {
    res.send('ok')
});

server.listen(port)

// Setup Electron window
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
    });

    win.loadFile("index.html");
};

app.whenReady().then(() => {
    createWindow();
});


// TODO Make default behaviour to keep running in background when window is closed, only quit when app is in development mode
app.on("window-all-closed", () => {
    app.quit();
});
