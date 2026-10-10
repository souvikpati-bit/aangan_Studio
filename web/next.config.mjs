// Share the single .env that lives one folder up (the same file the scripts use).
try { process.loadEnvFile(new URL("../.env", import.meta.url)); } catch { /* on Vercel, variables come from the dashboard */ }

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // The rules engine lives in ../engine and is shared with the scripts and tests.
  experimental: { externalDir: true },
};
