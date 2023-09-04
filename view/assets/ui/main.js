let bodyHtml = null;
let readyBody = '';
let loginBody = '';
let activeBody = '';
let session = null;

(async () => {
    const bodyHtmlLoad = document.getElementById('content');

    const readyBodyLoad = await (await fetch('ready.html')).text();
    const loginBodyLoad = await (await fetch('login.html')).text();
    const activeBodyLoad = await (await fetch('active.html')).text();
    
    const init = () => {
        bodyHtmlLoad.innerHTML = readyBodyLoad;
        
        bodyHtml = bodyHtmlLoad;

        readyBody = readyBodyLoad;
        loginBody = loginBodyLoad;
        activeBody = activeBodyLoad;
    }
    
    init();
})();

window.electronAPI.onLogin((event, loginObject) => {    
    bodyHtml.innerHTML = loginBody;

    const confirmElement = document.getElementById('confirm')
    const denyElement = document.getElementById('deny')

    confirmElement.addEventListener('click', () => {
        session = loginObject;
        confirmLogin();
    });
    denyElement.addEventListener('click', denyLogin);

    const nameElement = document.getElementById('name');
    nameElement.innerText = loginObject.sessionObject.firstName;

    const emailElement = document.getElementById('email');
    emailElement.innerText = loginObject.sessionObject.email;

    const websiteInput = document.getElementById('website');
    websiteInput.innerText = loginObject.url;
});


const confirmLogin = () => {
    bodyHtml.innerHTML = activeBody;

    const nameElement = document.getElementById('name');
    nameElement.innerText = session.sessionObject.firstName;

    const websiteInput = document.getElementById('website');
    websiteInput.innerText = session.url;

    window.electronAPI.confirmLogin();
    
    const logOutBtn = document.getElementById('logout');
    
    logOutBtn.addEventListener('click', () => {
        denyLogin();
        bodyHtml.innerHTML = readyBody;
    });
}

const denyLogin = () => {
    bodyHtml.innerHTML = readyBody;

    window.electronAPI.denyLogin();
}