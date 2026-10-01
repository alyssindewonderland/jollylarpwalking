import { cookies } from "next/headers";

export const SESSION_COOKIE = "stride_session";
export const ADMIN_COOKIE = "stride_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year, "nobody should ever log in again"

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Web Crypto (not Node's `crypto` module) so this works identically in Node route
// handlers and in the Edge-runtime middleware that guards member/admin routes.
async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(sig);
}

/** memberId.expiry.signature, long-lived — this is the whole web session. */
export async function createSessionValue(memberId: string): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${memberId}.${expires}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionValue(value: string | undefined | null): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [memberId, expiresStr, signature] = parts;
  const payload = `${memberId}.${expiresStr}`;
  if ((await sign(payload)) !== signature) return null;
  if (Date.now() > Number(expiresStr)) return null;
  return memberId;
}

export async function getSessionMemberId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionValue(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(memberId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionValue(memberId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function isAdminSession(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === process.env.ADMIN_SECRET;
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, process.env.ADMIN_SECRET ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/** 6-digit numeric pairing code, for carrying a session from Safari into the installed PWA. */
export function generatePairingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
