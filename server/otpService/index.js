/*
  OTP Service
  - Endpoints:
    POST /request-otp  { email }
    POST /verify-otp   { email, otp }

  Requirements (env):
    FIREBASE_SERVICE_ACCOUNT  => JSON string of service account
    OTP_MAX_ATTEMPTS (optional, default 5)
    OTP_EXPIRY_SECONDS (optional, default 300)
    SENDGRID_API_KEY OR SMTP_* vars for sending email

  Install: npm i express firebase-admin bcryptjs cors body-parser @sendgrid/mail nodemailer
*/
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);
const EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || "300", 10); // 5 minutes

// Initialize Firebase Admin using a service account JSON string in env
if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.error("FIREBASE_SERVICE_ACCOUNT env missing");
    // still allow app to start for dev, but endpoints will error until configured
  } else {
    try {
      const serviceAccount = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[otpService] Firebase Admin initialized");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
    }
  }
}

// Setup email sender: prefer SendGrid, fallback to SMTP
let sendEmail;
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sendEmail = async ({ to, subject, text, html }) => {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM || "no-reply@example.com",
      subject,
      text,
      html,
    });
  };
  console.log("[otpService] Using SendGrid for email");
} else if (process.env.SMTP_HOST) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  sendEmail = async ({ to, subject, text, html }) => {
    await transporter.sendMail({
      to,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      subject,
      text,
      html,
    });
  };
  console.log("[otpService] Using SMTP for email");
} else {
  sendEmail = async () => {
    throw new Error(
      "No email provider configured (SENDGRID_API_KEY or SMTP_HOST required)",
    );
  };
  console.warn(
    "[otpService] No email provider configured; requests will fail until configured",
  );
}

const db = () => admin.firestore();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

app.post("/request-otp", async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ error: "email_required" });
  if (!admin.apps.length)
    return res.status(500).json({ error: "admin_not_initialized" });

  try {
    const otp = generateOtp();
    const salt = bcrypt.genSaltSync(10);
    const otpHash = bcrypt.hashSync(otp, salt);

    const ref = db().collection("emailOtps").doc(email);
    const expiresAt = nowSeconds() + EXPIRY_SECONDS;

    await ref.set(
      {
        otpHash,
        attempts: 0,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        verified: false,
      },
      { merge: true },
    );

    // send email (don't include internal IDs)
    const subject = "Your verification code";
    const text = `Your verification code is ${otp}. It expires in ${Math.ceil(EXPIRY_SECONDS / 60)} minutes.`;
    const html = `<p>Your verification code is <strong>${otp}</strong>.</p><p>This code expires in ${Math.ceil(EXPIRY_SECONDS / 60)} minutes.</p>`;

    await sendEmail({ to: email, subject, text, html });

    return res.json({ ok: true, expiresIn: EXPIRY_SECONDS });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "internal_error", message: err.message });
  }
});

app.post("/verify-otp", async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  const otp = (req.body.otp || "").toString().trim();
  if (!email || !otp)
    return res.status(400).json({ error: "email_and_otp_required" });
  if (!admin.apps.length)
    return res.status(500).json({ error: "admin_not_initialized" });

  try {
    const ref = db().collection("emailOtps").doc(email);
    const snap = await ref.get();
    if (!snap.exists)
      return res.status(400).json({ error: "invalid_or_expired" });
    const data = snap.data();
    const now = nowSeconds();

    if (data.verified)
      return res.status(400).json({ error: "already_verified" });
    if (!data.expiresAt || now > data.expiresAt) {
      return res.status(400).json({ error: "expired" });
    }
    if (data.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: "too_many_attempts" });
    }

    const match = bcrypt.compareSync(otp, data.otpHash || "");
    if (!match) {
      await ref.update({ attempts: admin.firestore.FieldValue.increment(1) });
      const remaining = Math.max(0, MAX_ATTEMPTS - (data.attempts || 0) - 1);
      return res
        .status(400)
        .json({ error: "invalid_otp", remainingAttempts: remaining });
    }

    // mark verified and create (or get) user, then issue custom token
    await ref.update({
      verified: true,
      attempts: admin.firestore.FieldValue.increment(1),
    });

    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch (e) {
      // user not found -> create
      user = await admin.auth().createUser({ email, emailVerified: true });
    }

    const customToken = await admin.auth().createCustomToken(user.uid);

    // Optionally delete otp document for hygiene
    try {
      await ref.delete();
    } catch (e) {
      /* ignore */
    }

    return res.json({ ok: true, token: customToken });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "internal_error", message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`[otpService] listening on :${port}`));

module.exports = app;
