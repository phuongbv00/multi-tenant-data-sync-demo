"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
// Infrastructure: PostgreSQL Connection Pool
const pg_1 = require("pg");
const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "demo",
    password: process.env.DB_PASSWORD || "demo123",
    database: process.env.DB_NAME || "source_db",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
exports.pool = new pg_1.Pool(config);
// Graceful shutdown
process.on("SIGTERM", async () => {
    await exports.pool.end();
});
//# sourceMappingURL=PostgresConnection.js.map