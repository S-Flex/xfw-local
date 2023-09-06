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
    }

    /**
     * This method will return all logs that were added while the application was running.
     * 
     * @returns {string[]} all logs
     */
    static getAllLogs() {
        return Logs.logs || [];
    }

}

module.exports = Logs;
