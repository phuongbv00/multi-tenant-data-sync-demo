// Infrastructure: PostgreSQL Connection Pool
import { Pool, PoolConfig } from "pg";

const config: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "demo",
  password: process.env.DB_PASSWORD || "demo123",
  database: process.env.DB_NAME || "source_db",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

// Graceful shutdown
process.on("SIGTERM", async () => {
  await pool.end();
});
