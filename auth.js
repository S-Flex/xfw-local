const { session } = require("electron");

class authenticator {

    // Compare the token from the request with the local account token to make shure no other app can access the server
    static async checkRequest(token) {
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

    }

    static async login(websiteSource, username, password) {

        const anonSession = await fetch('https://xfw-hub.sflex.nl/api/OauthV2/loginAnon', {
            method: 'POST',
            body: JSON.stringify({ host: websiteSource }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const anonSessionString = await anonSession.json();

        const userSession = await fetch('https://xfw-hub.sflex.nl/api/OauthV2/login', {
            method: 'POST',
            body: JSON.stringify({
                Email: username,
                Password: password
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + anonSessionString
            }
        });

        const userSessionString = await userSession.json();

        this.localToken = userSessionString;

    } 

}

module.exports = authenticator;