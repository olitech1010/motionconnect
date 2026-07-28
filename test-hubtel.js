async function test() {
  const clientId = '4kNpJk0';
  const clientSecret = 'e4820e8323ec4ba39b840cfe33f240e0';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  console.log("Auth Header: Basic " + auth);

  const url = 'https://payproxyapi.hubtel.com/items/initiate';
  const payload = {
    totalAmount: 1,
    description: 'Motion Connect Wi-Fi: 1 GHS Live Test',
    callbackUrl: 'http://localhost:3000/api/payments/webhook',
    returnUrl: 'http://localhost:3000/portal/status?ref=MC-MS4ZK6FZ-B24U',
    merchantAccountNumber: '2011037',
    clientReference: 'MC-MS4ZK6FZ-B24U'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (e) {
    console.error(e)
  }
}

test();
