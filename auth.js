const { session } = require("electron");

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

    static async login(token) {

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

            return true;

        } else {
            this.localToken = null;

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

}

module.exports = authenticator;