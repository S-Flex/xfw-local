let bodyHtml = null;
let logoutBtn = null;
let readyBody = '';
let loginBody = '';
let activeBody = '';
let session = null;

(async () => {
    const bodyHtmlLoad = document.getElementById('content');
    const logoutBtnLoad = document.getElementById('logoutBtn');
    const exitBtnLoad = document.getElementById('exitBtn');

    const readyBodyLoad = await (await fetch('ready.html')).text();
    const loginBodyLoad = await (await fetch('login.html')).text();
    const activeBodyLoad = await (await fetch('active.html')).text();
    
    const init = () => {
        bodyHtmlLoad.innerHTML = readyBodyLoad;
        console.log('init')
        window.electronAPI.loginStatus();
        
        bodyHtml = bodyHtmlLoad;
        logoutBtn = logoutBtnLoad;

        readyBody = readyBodyLoad;
        loginBody = loginBodyLoad;
        activeBody = activeBodyLoad;

        logoutBtn.addEventListener('click', () => {
            denyLogin();
            bodyHtml.innerHTML = readyBody;
        });

        exitBtnLoad.addEventListener('click', () => {
            window.electronAPI.exit();
        });
    }
    
    init();
})();

window.electronAPI.onLoginStatus((event, loginObject) => {
    session = loginObject;
    confirmLogin(true);
});

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


const confirmLogin = (automaticLogin = false) => {
    window.electronAPI.confirmLogin([ document.getElementById('rememberMe')?.checked || automaticLogin ]);
    
    bodyHtml.innerHTML = activeBody;

    const nameElement = document.getElementById('name');
    nameElement.innerText = session.sessionObject.firstName;

    const websiteInput = document.getElementById('website');
    websiteInput.innerText = session.url;
    
    if(logoutBtn.classList.contains('d-none')) {
        logoutBtn.classList.remove('d-none');
    }

    if(logs.length === 0) {
        window.electronAPI.getAllLogs();
    }
}

const denyLogin = () => {
    bodyHtml.innerHTML = readyBody;

    window.electronAPI.denyLogin();

    if(!logoutBtn.classList.contains('d-none')) {
        logoutBtn.classList.add('d-none');
    }
}

let logs = [];

window.electronAPI.allLogs((event, allLogs) => {
   logs = allLogs;
   
   updateLogs();
});

window.electronAPI.onLog((event, log) => {
   logs.push(log);
   
   updateLogs();
});

const updateLogs = () => {
    const logsElement = document.getElementById('logs');
    
    if(logs.length === 0) {
        logsElement.innerHTML = '<tr><td>Geen logs</td></tr>';    
        return;
    }


    let logsHtml = '';

    logs.forEach(log => {
        let ifError = log.substring(log.length - 7, log.length) === 'failed.' ? ' class="bg-danger-subtle"' : '';
        logsHtml += '<tr><td' + ifError + '>' + log + '</td></tr>';
    });

    logsElement.innerHTML = logsHtml;
}