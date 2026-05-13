// Sync canonical data/cases.json (repo root) into web/src/data/ so Next.js can
// import it via @/data/cases.json. Runs before `next dev` and `next build`.

import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "..", "data", "cases.json");
const DEST_DIR = join(here, "..", "src", "data");
const DEST = join(DEST_DIR, "cases.json");

if (!existsSync(SRC)) {
  console.error(`[sync-data] source missing: ${SRC}`);
  process.exit(1);
}

mkdirSync(DEST_DIR, { recursive: true });
copyFileSync(SRC, DEST);
console.log(`[sync-data] ${SRC} -> ${DEST}`);
