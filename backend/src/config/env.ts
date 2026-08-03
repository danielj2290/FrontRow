// ======================
// Environment loader
// ======================
// The .env file lives at the REPO ROOT (../.env from /backend), not inside
// /backend. That's deliberate: one .env shared by every part of the project,
// one place to rotate keys.
//
// WHY resolve the path from this file's location instead of process.cwd():
// process.cwd() is "wherever you happened to run the command from". If you
// ran `npm run dev` from the repo root instead of /backend, a cwd-relative
// path would silently load nothing and every key would be undefined.
// import.meta.url is always THIS file's location, so the path never breaks.

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

// Small helper: fail LOUDLY at startup if a key is missing, instead of
// failing mysteriously later with a 401 from some API.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}\n` +
        `→ Check that it's set in the .env file at the repo root.`
    );
  }
  return value;
}
