import "server-only";
import { createDb, type Db } from "@gym/db";

// Una sola conexión por instancia del servidor (y por recarga en desarrollo).
const globalForDb = globalThis as unknown as { db?: Db };

export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
