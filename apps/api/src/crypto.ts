/** Web Crypto helpers keep passwords and session tokens out of D1 in plaintext. */
const encoder = new TextEncoder();
const HASH_ITERATIONS = 600_000;

export function base64Url(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64Url(new Uint8Array(hash));
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Url(bytes);
}

export async function hashPassword(password: string, pepper: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, pepper, salt);
  return `pbkdf2-sha256$${HASH_ITERATIONS}$${base64Url(salt)}$${base64Url(hash)}`;
}

export async function verifyPassword(password: string, pepper: string, stored: string): Promise<boolean> {
  const [algorithm, iterations, saltText, expectedText] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || Number(iterations) !== HASH_ITERATIONS || !saltText || !expectedText) return false;
  const actual = await derivePassword(password, pepper, fromBase64Url(saltText));
  return constantTimeEqual(actual, fromBase64Url(expectedText));
}

async function derivePassword(password: string, pepper: string, salt: Uint8Array): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(`${password}${pepper}`), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: HASH_ITERATIONS }, material, 256);
  return new Uint8Array(bits);
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  return left.reduce((difference, byte, index) => difference | (byte ^ right[index]), 0) === 0;
}

