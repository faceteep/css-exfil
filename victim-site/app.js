const express = require('express');
const app = express();

const HOST = "127.0.0.1";
const PORT = 5001;
const HOSTNAME = `http://${HOST}:${PORT}`;

app.use(express.static('public'));

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "script-src 'none'");
    next();
});

app.get('/', (req, res) => {
    const secret = req.query.secret || 'abc123';
    const vuln = req.query.vuln || '';
    const markup = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>CSS Injection</title>
        <link href='https://fonts.googleapis.com/css?family=Orbitron' rel='stylesheet'>
        <link href='https://fonts.googleapis.com/css?family=Saira Stencil One' rel='stylesheet'>
        <link rel="stylesheet" type="text/css" href="/app.css">
    </head>
    <body>
        <div class='stars'></div>
        <div class='twinkling'></div>
        <div id='container' class='vertically-center-layout'>
            <header>
                <h1>
                    <a href="/">
                        <span class="org-name">
                            United Star Command
                        </span>
                        UFO Reporting System
                    </a>
                </h1>
                <h2>CSS Injection</h2>
            </header>
            <main>
                <div class="app-container">
                    <div><div><div><div><div><div><div><div><div><div><div>
                    <form action="/" method="get">
                        <label for="secret">Secret:</label>
                        <input type="text" id="secret" name="secret" value="${secret}"/>
                        <button class="button--snazz" type="submit"><span class="button--snazz__line">Submit</span></button>
                        <input type="hidden" value="${vuln}"/>
                    </form>
                    </div></div></div></div></div></div></div></div></div></div></div>
                </div>
            </main>
        </div>
    </body>
    </html>
    `;

    res.send(markup);
});

app.listen(PORT, HOST, () => {
    console.log(`[+] Server is running at ${HOSTNAME}`);
});
