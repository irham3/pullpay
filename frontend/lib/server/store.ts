import "server-only";
import { promises as fs } from "fs";
import path from "path";

// Tiny file-backed store for GitHub handle → wallet mappings (PRD §30.5). A real
// deployment would use a DB / the on-chain mappedWallet; this keeps the MVP
// self-contained without a database.
const FILE = path.join(process.cwd(), ".pullpay-store.json");

type Store = { mappings: Record<string, string> }; // handle(lowercase) -> address

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { mappings: {} };
  }
}

async function write(store: Store): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function setMapping(handle: string, address: string) {
  const store = await read();
  store.mappings[handle.toLowerCase()] = address;
  await write(store);
}

export async function getMapping(handle: string): Promise<string | null> {
  const store = await read();
  return store.mappings[handle.toLowerCase()] ?? null;
}
