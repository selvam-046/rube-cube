import fs from 'fs';

async function main() {
    const targetsRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) return;

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 100;
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
    await sendCmd('Page.enable');
    await sendCmd('Runtime.enable');

    const evalJs = async (expr) => {
        const res = await sendCmd('Runtime.evaluate', { expression: expr, awaitPromise: true });
        return res?.result?.result?.value;
    };

    // Set viewport to 1500 x 950
    await sendCmd('Emulation.setDeviceMetricsOverride', {
        width: 1500,
        height: 950,
        deviceScaleFactor: 1,
        mobile: false
    });

    // Close any open modal
    await evalJs(`document.querySelector("button:has-text('Close')")?.click() || document.querySelector("button")?.click()`);
    await new Promise(r => setTimeout(r, 600));

    // Reload page to start fresh
    await sendCmd('Page.navigate', { url: 'http://127.0.0.1:5173' });
    await new Promise(r => setTimeout(r, 2000));

    // Click Scramble
    await evalJs(`document.getElementById('scramble-btn')?.click()`);
    await new Promise(r => setTimeout(r, 2200));

    // Take screenshot of scrambled cube + full Solution Panel
    const res = await sendCmd('Page.captureScreenshot', { format: 'png' });
    if (res?.result?.data) {
        fs.writeFileSync('C:\\Users\\sunde\\.gemini\\antigravity-ide\\brain\\cbafee51-51b3-4588-8af9-97a0cf6b783a\\full_solution_dashboard.png', Buffer.from(res.result.data, 'base64'));
        console.log('Saved full_solution_dashboard.png');
    }

    ws.close();
}

main().catch(console.error);
