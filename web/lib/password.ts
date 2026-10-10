import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Passwords are stored only as "scrypt$<salt>$<hash>". The plain password is never saved.
const run = (pw: string, salt: Buffer) => new Promise<Buffer>((res, rej) => scrypt(pw, salt, 64, (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${(await run(pw, salt)).toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [kind, saltHex, hashHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = await run(pw, Buffer.from(saltHex, "hex"));
  return got.length === expected.length && timingSafeEqual(got, expected);
}
