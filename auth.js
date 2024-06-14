const { session } = require("electron");
const homedir = require('os').homedir();
const { writeFile, mkdir, unlink, readFile } = require("fs/promises");
class authenticator {

    // Compare the token from the request with the local account token to make shure no other app can access the server
    static async checkRequest(token) {
        if(this.confirmed) {
            if(this.localToken && this.localToken == token) {
                return true;
            }

            const validSessions = await Promise.allSettled([
                fetch('https://xfw-hub.sflex.nl/api/OauthV2/info', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch('https://xfw-hub.sflex.nl/api/OauthV2/info', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + this.localToken,
                        'Content-Type': 'application/json'
                    }
                })
            ]);


            if(!validSessions.reduce((acc, cur) => acc && cur.value.status == 200, true)) {
                return false;
            }

            const [
                session1,
                session2
            ] = await Promise.all(validSessions.map((session) => session.value.json()))

            return session1.contactId === session2.contactId;
        } else {
            return false;
        }
    }

    /**
     * This method allows for a quick check if the token is from the same account
     * 
     * @param {string} token jwt session token
     * @returns boolean true if the token is from the same account
     */
    static async checkIfSameAccount(token) {

        const checkToken = await fetch('https://xfw-hub.sflex.nl/api/OauthV2/info', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if(checkToken.status === 200) {
            const sessionObject = await checkToken.json();

            return sessionObject.contactId == this.sessionObject.contactId;
        }

        return false;

    }

    static async login(url, token) {

        const checkToken = await fetch('https://xfw-hub.sflex.nl/api/OauthV2/info', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if(checkToken.status === 200) {
            this.localToken = token;

            const sessionObject = await checkToken.json();

            this.sessionObject = sessionObject;
            this.url = url;

            return true;

        } else {
            this.localToken = null;
            this.url = null;

            return new Error('Invalid token');
        }


    }

    static confirmLogin() {
        this.confirmed = true;
    }

    static denyLogin() {
        this.localToken = null;
        this.sessionObject = null;
        this.confirmed = false;
    }

    /**
     * Method for every route to check if the request is valid
     * @param {Express.Request} req
     * @param {Express.Response} res
     * @param {Express.next} next
     */
    static async auth(req, res, next) {
        const authToken = req.headers.authorization;

        if(await authenticator.checkRequest(authToken.replace('Bearer ', ''))) {
            next();
        } else {
            res.status(401).send('Unauthorized');
        }

    }

    /**
     * This method will store the credentials in the credentials.conf file
     * 
     * @param {string} token jwt of session
     * @param {string} url source domain
     */
    static async storeCredentials() {
        // check if folder exists
        const storageLocation = getStorageLocation();

        try {
            await mkdir(storageLocation);
        } catch(e) {
            // folder already exists
        }

        try {
            await writeFile(storageLocation + getFileName, this.localToken + '\n' + this.url, { flag: 'w' });
        } catch(e) {
            // file already exists
        }
    }

    /**
     * This method will load the credentials from the credentials.conf file
     * 
     * @returns {boolean} if successful code will return true
     */
    static async loadCredentials() {
        const storageLocation = getStorageLocation();

        try {
            const credentials = await readFile(storageLocation + getFileName, 'utf-8');

            const [
                token,
                url
            ] = credentials.split('\n');

            this.login(url, token);

        } catch(e) {
            return null;
        }
    }

    /**
     * Method to clear the credentials file
     */
    static async clearCredentials() {
        const storageLocation = getStorageLocation();

        try {
            await unlink(storageLocation + getFileName);
        } catch(e) {
            // file does not exists
        }
    }

}

const getStorageLocation = () => {
    switch(process.platform) {
        case 'win32':
            return homedir + '\\AppData\\Roaming\\xfw-local\\';
        case 'darwin':
            return homedir + '/Library/Application Support/xfw-local/';
        case 'linux':
            return homedir + '/.config/xfw-local/';
    }
}

const getFileName = 'credentials.conf';

module.exports = authenticator;