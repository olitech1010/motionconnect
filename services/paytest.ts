async function testHubtel() {
    const clientId = 'YV5L5PY';
    const clientSecret = 'fa8bf1c435994d9081ff70fc7c8693eb';
    // Base64 encode the credentials for Basic Auth
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = 'https://payproxyapi.hubtel.com/items/initiate';
    const payload = {
        totalAmount: 1,
        description: 'Motion Connect Wi-Fi: 1 GHS Live Test',
        callbackUrl: 'http://localhost:3000/api/payments/webhook',
        returnUrl: 'http://localhost:3000/portal/status?ref=MC-TEST',
        merchantAccountNumber: '2039708',
        clientReference: 'MC-TEST'
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(payload)
    });
}


