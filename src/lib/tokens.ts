// Node-only (uses the `crypto` module) — never import this from middleware.ts or
// anything else that has to run on the Edge runtime. Session verification lives in
// auth.ts instead, built on Web Crypto, specifically so it's Edge-safe.
import { randomBytes, createHash } from "crypto";

/** A random URL-safe token, e.g. for invite links / Shortcut bearer tokens. Shown once. */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
