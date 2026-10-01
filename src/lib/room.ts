import { cookies } from "next/headers";

export const ROOM_COOKIE = "stride_room";
const ROOM_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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

// Same Web Crypto approach as lib/auth.ts, so this stays Edge-safe for middleware.
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

export function checkRoomPin(pin: string): boolean {
  const expected = process.env.ROOM_PIN;
  return Boolean(expected) && pin === expected;
}

export async function createRoomCookieValue(): Promise<string> {
  const payload = "room-ok";
  return `${payload}.${await sign(payload)}`;
}

export async function verifyRoomCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  return (await sign(payload)) === signature;
}

export async function hasRoomAccess(): Promise<boolean> {
  const store = await cookies();
  return verifyRoomCookieValue(store.get(ROOM_COOKIE)?.value);
}

export async function setRoomCookie() {
  const store = await cookies();
  store.set(ROOM_COOKIE, await createRoomCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ROOM_MAX_AGE_SECONDS,
    path: "/",
  });
}
