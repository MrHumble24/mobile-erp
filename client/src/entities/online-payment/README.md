# entities/online-payment

Client entity for staff online payment gateway configurations and refund management.

## API
- `listProviders()`: `GET /online-payments/providers`
- `getProvider(code)`: `GET /online-payments/providers/:code`
- `updateProvider(code, dto)`: `PUT /online-payments/providers/:code`
- `setSecret(code, secret)`: `POST /online-payments/providers/:code/secret`
- `checkProvider(code)`: `POST /online-payments/providers/:code/check`
- `refundPayment(paymentId, reason)`: `POST /online-payments/:id/refund`
