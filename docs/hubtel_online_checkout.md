Online Checkout
Last updated July 17th, 2026

Overview
The Online Checkout API allows merchants to accept online payment for goods and services using:
Mobile Money
Bank Card
Wallet (Hubtel, G-Money)
GhQR
Cash / Cheque

This API offers RESTful endpoints that integrate online payments into any application.

You may implement the Hubtel Online Checkout to:
Redirect to the Hubtel Website to take payment - Redirect Checkout
Take payment on your own website - Onsite Checkout

Redirect Checkout - How it Works
A customer arrives on your website and clicks on a pay button.
The customer is redirected to the Hubtel checkout page.
The customer selects how they wish to pay.
The customer verifies their identity by inputting their mobile number to receive an OTP.
When payment is completed, a success or failure notification is presented to the customer.
The customer is finally redirected back to your website via your return URL.

Note
In instances where a merchant does not receive the final status of the transaction after five (5) minutes from Hubtel, it is mandatory to perform a status check using the Transaction Status Check API to determine the final status of the transaction.

API Reference
The Online Checkout API allows merchants to accept online payment for goods and services. To initiate a transaction, send an HTTP POST request to the below URL with the required parameters.

API Endpoint
https://payproxyapi.hubtel.com/items/initiate
Request Type
POST

Checkout Callback
You will need to implement a callback endpoint on your server to receive payment and order notification statuses.

Note
Businesses that want to add an extra layer of security to ensure callbacks reach their endpoint securely can whitelist Hubtel’s callback IP address: 108.129.40.25

SAMPLE CALLBACK
JSON
{ "ResponseCode": "0000", "Status": "Success", "Data": { "CheckoutId": "59e2fbbff4e443b98e09346881ac7e9a", "SalesInvoiceId": "e96ccfb4746045bba13f425bd573a31c", "ClientReference": "Kaks545253", "Status": "Success", "Amount": 0.5, "CustomerPhoneNumber": "233242825109", "PaymentDetails": { "MobileMoneyNumber": "233242825109", "PaymentType": "mobilemoney", "Channel": "mtn-gh" }, "Description": "The MTN Mobile Money payment has been approved and processed successfully." } }

Transaction Status Check
It is mandatory to implement the Transaction Status Check API as it allows merchants to check for the status of a transaction in rare instances where a merchant does not receive the final status of the transaction from Hubtel after five (5) minutes.

API Endpoint
https://api-txnstatus.hubtel.com/transactions/{Collection_Account_Number}/status
Request Type
GET

REQUEST PARAMETERS
Parameter: clientReference (String) Mandatory (preferred)
The client reference of the transaction specified in the request payload.

SAMPLE REQUEST
GET /transactions/11684/status?clientReference=inv0012 HTTP/1.1 Host: api-txnstatus.hubtel.com Authorization: Basic endjeOBiZHhza24==

SAMPLE RESPONSE (Paid)
200 OK
{ "message": "Successful", "responseCode": "0000", "data": { "date": "2024-04-25T21:45:48.4740964Z", "status": "Paid", "transactionId": "7fd01221faeb41469daec7b3561bddc5", "externalTransactionId": "0000006824852622", "paymentMethod": "mobilemoney", "clientReference": "inv0012", "currencyCode": null, "amount": 0.1, "charges": 0.02, "amountAfterCharges": 0.08, "isFulfilled": null } }
