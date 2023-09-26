const { writeFile, mkdir, readFile } = require("fs/promises");
const homedir = require('os').homedir();

class Logs {

    /**
     * This method will set/update the window of the electron application.
     * 
     * @param {Electron.window} window main menu of the electron application
     */
    static setWindow(window) {
        Logs.window = window;
    }

    /**
     * This method will add a log to the logs array and send it to the renderer process.
     * 
     * @param {string} log message that describes the action that was performed
     */
    static addLog(log) {
        if(Logs.logs === undefined)
            Logs.logs = [];

        Logs.logs.push(log);

        if(Logs.window)
            Logs.window.webContents.send('log', log);

        // Storage logs to log file.
        const currentLog = { date: new Date(), log: log };

        Logs.storeLog(currentLog);
    }

    /**
     * This method will return all logs that were added while the application was running.
     * 
     * @returns {string[]} all logs
     */
    static getAllLogs() {
        return Logs.logs || [];
    }

    /**
     * this method will add the log to a file and will remove logs older than 3 months.
     * 
     * @param {{ date: Date, log: string }} log object that contains action and date
     */
    static async storeLog(log) {

        const storageLocation = getStorageLocation();

        // check if folder exists
        try {
            await mkdir(storageLocation);
        } catch(e) {
            // folder already exists
        }

        // Try to find the file and load it. If it not exists then we create a file from scratch.
        // If there is a file present then we will load it and add the new log to it.
        try {

            // load file
            const logs = await readFile(storageLocation + logFileName, 'utf-8');
            const parsedLogs = JSON.parse(logs);

            // add new log
            parsedLogs.push(log);

            // remove logs older than 3 months
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            const filteredLogs = parsedLogs
                .map((log) => { log.date = (typeof log.date === 'string' ? new Date(log.date) : log.date); return log; }) // make sure every date is a date object
                .filter((log) => log.date > threeMonthsAgo);

            // write file
            await writeFile(storageLocation + logFileName, JSON.stringify(filteredLogs), { flag: 'w' });

        } catch(e) {
            // File dit not exist. Create a new one.

            // write file
            await writeFile(storageLocation + logFileName, JSON.stringify([log]), { flag: 'w' });
        }
    }

    /**
     * This method will retrieve all logs that were stored in the log file.
     * 
     * @returns {Promise<{ date: Date, log: string }[]>} all logs that were stored in the log file
     */
    static async loadLogs() {

        const storageLocation = getStorageLocation();

        try {
            readFile(storageLocation + logFileName, 'utf-8').then((logs) => {
                const parsedLogs = JSON.parse(logs);

                if(parsedLogs.length > 0)
                    Logs.logs = parsedLogs.map((logObj) => logObj.log);

            }).catch((e) => {
                // file does not exists
            });

        } catch(e) {
            // file does not exists
        }

    }

}

const logFileName = 'logs.json';

/**
 * This method will return the storage location for the logs file.
 */
getStorageLocation = () => {
    switch(process.platform) {
        case 'win32':
            return homedir + '\\AppData\\Roaming\\xfw-local\\';
        case 'darwin':
            return homedir + '/Library/Application Support/xfw-local/';
        case 'linux':
            return homedir + '/.config/xfw-local/';
    }
}

module.exports = Logs;