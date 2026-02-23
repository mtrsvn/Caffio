import { signInWithCustomToken, updatePassword } from "firebase/auth";
import { addUserDoc, auth } from "../../firebaseconfig";

const DEFAULT_SERVER =
  process.env.OTP_SERVER_URL || "https://your-otp-server.com";

export async function requestOtp(email: string, serverUrl = DEFAULT_SERVER) {
  const res = await fetch(`${serverUrl.replace(/\/$/, "")}/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error || err?.message || `request failed ${res.status}`,
    );
  }
  return res.json();
}

export async function verifyOtpAndSignIn(
  email: string,
  otp: string,
  serverUrl = DEFAULT_SERVER,
) {
  const res = await fetch(`${serverUrl.replace(/\/$/, "")}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      payload?.error || payload?.message || `verify failed ${res.status}`,
    );
  }

  if (!payload?.token) throw new Error("no_token_returned");

  const userCred = await signInWithCustomToken(auth, payload.token);
  return { user: userCred.user, raw: payload };
}

export async function verifyOtpAndCompleteRegistration(
  email: string,
  otp: string,
  username: string,
  password: string,
  serverUrl = DEFAULT_SERVER,
) {
  const res = await fetch(`${serverUrl.replace(/\/$/, "")}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      payload?.error || payload?.message || `verify failed ${res.status}`,
    );
  }
  if (!payload?.token) throw new Error("no_token_returned");

  const userCred = await signInWithCustomToken(auth, payload.token);
  const user = userCred.user;

  if (password) {
    try {
      await updatePassword(user, password);
    } catch (e) {
      throw new Error((e as any)?.message || "failed_set_password");
    }
  }

  try {
    await addUserDoc(user.uid, {
      email: user.email || "",
      username: username || "",
    });
  } catch (e) {
    console.warn("addUserDoc failed:", e);
  }

  return { user, raw: payload };
}

export default { requestOtp, verifyOtpAndSignIn };
