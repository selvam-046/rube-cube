import fs from 'fs';

async function main() {
    // Get target page ws url
    const targetsRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) {
        console.error('No page target found');
        return;
    }

    const wsUrl = pageTarget.webSocketDebuggerUrl;
    console.log('Connecting to Page WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && callbacks.has(data.id)) {
            const cb = callbacks.get(data.id);
            callbacks.delete(data.id);
            cb(data);
        }
    };

    const sendCmd = (method, params = {}) => {
        return new Promise((resolve) => {
            const id = msgId++;
            callbacks.set(id, resolve);
            ws.send(JSON.stringify({ id, method, params }));
        });
    };

    await new Promise((res) => (ws.onopen = res));

    // Enable Page and Runtime
    await sendCmd('Page.enable');
    await sendCmd('Runtime.enable');

    const evalJs = async (expr) => {
        const res = await sendCmd('Runtime.evaluate', { expression: expr, awaitPromise: true });
        return res?.result?.result?.value;
    };

    const captureScreenshot = async (filename) => {
        const res = await sendCmd('Page.captureScreenshot', { format: 'png' });
        if (res?.result?.data) {
            fs.writeFileSync(filename, Buffer.from(res.result.data, 'base64'));
            console.log(`Saved screenshot: ${filename}`);
        }
    };

    console.log('Waiting for initial render...');
    await new Promise(r => setTimeout(r, 1500));

    // 1. Click Scramble Button
    console.log('Clicking Scramble button...');
    await evalJs(`document.getElementById('scramble-btn')?.click()`);
    await new Promise(r => setTimeout(r, 2000));

    // Capture Scrambled state + loaded solution
    await captureScreenshot('C:\\Users\\sunde\\.gemini\\antigravity-ide\\brain\\cbafee51-51b3-4588-8af9-97a0cf6b783a\\scramble_with_solution.png');

    // 2. Click Open Scanner Modal
    console.log('Clicking Open Scanner button...');
    await evalJs(`document.getElementById('open-scanner-btn')?.click()`);
    await new Promise(r => setTimeout(r, 1500));

    // Capture Scanner Modal
    await captureScreenshot('C:\\Users\\sunde\\.gemini\\antigravity-ide\\brain\\cbafee51-51b3-4588-8af9-97a0cf6b783a\\scanner_modal.png');

    ws.close();
    console.log('Automation complete!');
}

main().catch(console.error);
