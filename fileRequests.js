// Setup express router
const express = require('express');
const router = express.Router();

// Local services import
const auth = require("./auth");
const logs = require("./logs");

// Import file system
const { readdir, readFile, copyFile, rename, unlink, mkdir, writeFile, rmdir } = require('fs/promises');

// This request lists all files and directories in a directory
router.post('/ls', auth.auth, (req, res) => {
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

        logs.addLog("Listed directory on " + directory);
    }).catch(() => {
        res.status(404).send('Directory does not exist.')

        logs.addLog("Tried to list directory on " + directory + " but failed.");
    });

});

// This request returns a file from path in base64
router.post('/getFile', auth.auth, (req, res) => {
    const path = req.body.path;

    if(!path) {
        res.status(400).send('Path not provided.')
        return;
    }

    readFile(path).then(result => {
        res.send({
            "fileName": path.substr(path.lastIndexOf('/')+1),
            "fileBase64": result.toString('base64')
        });

        logs.addLog("Created file on " + path);
    }).catch(() => {
        res.status(404).send('File does not exist.')

        logs.addLog("Tried to create file on " + path + " but failed.");
    });
});

// This requests is used to rename a file and/or location.
router.post('/moveFile', auth.auth, (req, res) => {
    const filePath = req.body.path;
    const newLocation = req.body.newLocation;

    if(!filePath || !newLocation) {
        res.status(400).send('Path and/or new location not provided.')
        return;
    }

    rename(filePath, newLocation).then(() => {
        res.send('ok');

        logs.addLog("Moved file from " + filePath + " to " + newLocation);
    }).catch(() => {
        res.status(400).send('File does not exist. Nothing to rename.')

        logs.addLog("Tried to move file from " + filePath + " to " + newLocation + " but failed.");
    })
});

// This request is used to duplicate files.
router.post('/copyFile', auth.auth, (req, res) => {
    const filePath = req.body.path;
    const newLocation = req.body.newFile;

    if(!filePath || !newLocation) {
        res.status(400).send('Path and/or new file name not provided.')
        return;
    }

    copyFile(filePath, newLocation).then(() => {
        res.send('ok')

        logs.addLog("Copied file from " + filePath + " to " + newLocation);
    }).catch(() => {
        res.status(404).send('File does not exist. No file to copy.');

        logs.addLog("Tried to copy file from " + filePath + " to " + newLocation + " but failed.");
    })

});

// This request is used to unload(delete) a file from the local file system.
router.post('/deleteFile', auth.auth, (req, res) => {
    const path = req.body.path;

    if(!path) {
        res.status(400).send('Path not provided.')
        return;
    }

    unlink(path).then(() => {
        res.send('ok')

        logs.addLog("Deleted file on " + path);
    }).catch(() => {
        res.status(404).send('File does not exist. Nothing to delete.')

        logs.addLog("Tried to delete file on " + path + " but failed.");
    });
});

// This method is used to upload a file to the local file system
router.post('/downloadFile', auth.auth, (req, res) => {
    const fileBase64 = req.body.fileBase64;
    const path = req.body.path;
    const fileName = req.body.fileName;

    if(!fileBase64 || !path || !fileName) {
        res.status(400).send('FileBase64 string, path and/or file name not provided.')
        return;
    }

    writeFile(path + '/' + fileName, fileBase64, 'base64').then(() => {
        res.send('ok')

        logs.addLog("Uploaded file on " + path + '/' + fileName);
    }).catch(() => {
        logs.addLog("Tried to upload file on " + path + '/' + fileName + " but failed.");
        
        res.status(403).send('Root path does not exist or no permission to write file.')
    });
});

// This method is used to create a directory at a specific path
router.post('/createFolder', auth.auth, (req, res) => {
    const rootPath = req.body.rootPath;
    const newDirName = req.body.newDirName;

    if(!rootPath || !newDirName) {
        res.status(400).send('Root path and/or new directory name not provided.')
        return;
    }

    mkdir(rootPath + '/' + newDirName).then(() => {
        res.send('ok')

        logs.addLog("Created directory on " + rootPath + '/' + newDirName);
    }).catch(() => {
        res.status(404).send('Root path does not exist.')

        logs.addLog("Tried to create directory on " + rootPath + '/' + newDirName + " but failed.");
    });
});

// This method is used to delete a directory and optionally all files in it recursively
router.post('/deleteFolder', auth.auth, async (req, res) => {
    const path = req.body.path;
    const recursive = req.body.recursive;

    if(!path) {
        res.status(400).send('Path not provided.')
        return;
    }

    try {
        await rmdir(path, { recursive: !!recursive, force: true})

        res.send('ok')
    } catch(e) {
        if(!!recursive) {
            res.status(404).send('Directory does not exist.')

            logs.addLog("Tried to delete directory on " + path + " but failed.");
        } else {
            res.status(403).send('Directory is not empty or does not exist. If not empty, use recursive option.')

            logs.addLog("Tried to delete directory on " + path + " but failed.");
        }
    }
});

//  export router
module.exports = router;