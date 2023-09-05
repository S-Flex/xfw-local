let bodyHtml = null;
let logoutBtn = null;
let readyBody = '';
let loginBody = '';
let activeBody = '';
let session = null;

(async () => {
    const bodyHtmlLoad = document.getElementById('content');
    const logoutBtnLoad = document.getElementById('logoutBtn');

    const readyBodyLoad = await (await fetch('ready.html')).text();
    const loginBodyLoad = await (await fetch('login.html')).text();
    const activeBodyLoad = await (await fetch('active.html')).text();
    
    const init = () => {
        bodyHtmlLoad.innerHTML = readyBodyLoad;
        
        bodyHtml = bodyHtmlLoad;
        logoutBtn = logoutBtnLoad;

        readyBody = readyBodyLoad;
        loginBody = loginBodyLoad;
        activeBody = activeBodyLoad;

        logoutBtn.addEventListener('click', () => {
            denyLogin();
            bodyHtml.innerHTML = readyBody;
        });
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
    
    if(logoutBtn.classList.contains('d-none')) {
        logoutBtn.classList.remove('d-none');
    }
}

const denyLogin = () => {
    bodyHtml.innerHTML = readyBody;

    window.electronAPI.denyLogin();

    if(!logoutBtn.classList.contains('d-none')) {
        logoutBtn.classList.add('d-none');
    }
}