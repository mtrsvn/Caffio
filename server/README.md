# OTP Service (server)

This small Express service issues 6-digit email OTPs and returns a Firebase custom token on successful verification.

Environment variables (required)

- FIREBASE_SERVICE_ACCOUNT: JSON string of Firebase service account credentials
- SENDGRID_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS and SMTP_FROM

Optional

- OTP_MAX_ATTEMPTS (default 5)
- OTP_EXPIRY_SECONDS (default 300)

Install and run

```
npm install express firebase-admin bcryptjs cors body-parser @sendgrid/mail nodemailer
node server/otpService/index.js
```

Notes

- The service stores only a bcrypt-hash of the OTP in Firestore under collection `emailOtps`.
- On successful verification the service creates the user (if missing) and returns a custom auth token.
- For production deploy behind HTTPS and protect the service with rate-limiting and authentication as desired.

## Using Gmail SMTP (app password)

You can use Gmail as an SMTP provider for small-scale or dev usage. For production it's recommended to use a transactional email provider like SendGrid, Mailgun, or SES.

Steps to create an App Password (recommended over using your main Gmail password):

1. Enable 2-Step Verification for the Gmail account you want to send from.
2. Go to Google Account -> Security -> App passwords.
3. Create an App Password for "Mail" and copy the generated 16-character password.
4. Set the following environment variables for the OTP service:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@gmail.com
SMTP_PASS=<your-app-password>
SMTP_FROM=your-account@gmail.com
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", ... }'
```

Notes and alternatives:

- Use port 465 with `SMTP_SECURE=true` for SSL, or port 587 with `SMTP_SECURE=false` (STARTTLS).
- Gmail has sending limits and is not intended for high-volume transactional emails.
- For long-term production use with Gmail/Workspace consider implementing OAuth2 for SMTP (requires client ID/secret and refresh token) or use a dedicated transactional provider.

## Dev testing (no external provider)

- Use Mailtrap or Ethereal for safe local testing. Mailtrap provides SMTP credentials you can use in place of Gmail and captures emails in a web inbox for inspection.
