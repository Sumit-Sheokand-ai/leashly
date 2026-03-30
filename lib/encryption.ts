import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY ?? "32-char-secret-key-change-in-prod";
  return Buffer.from(key.padEnd(KEY_LENGTH, "0").slice(0, KEY_LENGTH), "utf8");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function generateProxyKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "lsh_";
  const bytes = crypto.randomBytes(24);
  for (let i = 0; i < 24; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
