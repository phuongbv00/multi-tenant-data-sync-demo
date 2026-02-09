"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Main Entry Point - Consumer Service
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pg_1 = require("pg");
const express_1 = __importDefault(require("express"));
const SyncUserUseCase_1 = require("./application/use-cases/SyncUserUseCase");
const ReferenceApiClient_1 = require("./infrastructure/http/ReferenceApiClient");
const UserCacheRepository_1 = require("./infrastructure/database/UserCacheRepository");
const UserEventConsumer_1 = require("./infrastructure/kafka/UserEventConsumer");
const PORT = parseInt(process.env.PORT || "8002");
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "demo",
    password: process.env.DB_PASSWORD || "demo123",
    database: process.env.DB_NAME || "source_db",
});
async function main() {
    console.log("Starting Consumer Service...");
    // Initialize dependencies
    const referenceApiClient = new ReferenceApiClient_1.ReferenceApiClient(process.env.SOURCE_SERVICE_URL || "http://localhost:8001", "consumer-service");
    const userCacheRepository = new UserCacheRepository_1.UserCacheRepository(pool);
    const syncUseCase = new SyncUserUseCase_1.SyncUserUseCase(referenceApiClient, userCacheRepository);
    const kafkaConsumer = new UserEventConsumer_1.UserEventConsumer(syncUseCase);
    // Simple health endpoint
    const app = (0, express_1.default)();
    app.get("/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    // API to view cached users
    app.get("/cache/users", async (req, res) => {
        try {
            const users = await userCacheRepository.findAll();
            res.json({ data: users });
        }
        catch (error) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
    const server = app.listen(PORT, () => {
        console.log(`Consumer Service running on port ${PORT}`);
    });
    // Start Kafka consumer
    await kafkaConsumer.start("user-events");
    // Graceful shutdown
    const shutdown = async () => {
        console.log("Shutting down...");
        await kafkaConsumer.stop();
        server.close(() => {
            pool.end().then(() => {
                console.log("Shutdown complete");
                process.exit(0);
            });
        });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}
main().catch((error) => {
    console.error("Failed to start:", error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map