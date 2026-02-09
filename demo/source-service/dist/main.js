"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Main Entry Point - Source Service
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PostgresConnection_1 = require("./infrastructure/database/PostgresConnection");
const server_1 = require("./presentation/http/server");
const KafkaPublisher_1 = require("./infrastructure/messaging/KafkaPublisher");
const OutboxPollingWorker_1 = require("./infrastructure/workers/OutboxPollingWorker");
const PORT = parseInt(process.env.PORT || "8001");
async function main() {
    console.log("Starting Source Service...");
    // Create HTTP server
    const app = (0, server_1.createServer)(PostgresConnection_1.pool);
    // Create Kafka publisher and outbox worker
    const kafkaPublisher = new KafkaPublisher_1.KafkaPublisher();
    const outboxWorker = new OutboxPollingWorker_1.OutboxPollingWorker(PostgresConnection_1.pool, kafkaPublisher, 500, 50);
    // Start HTTP server
    const server = app.listen(PORT, () => {
        console.log(`Source Service running on port ${PORT}`);
    });
    // Start outbox worker
    await outboxWorker.start();
    // Graceful shutdown
    const shutdown = async () => {
        console.log("Shutting down...");
        await outboxWorker.stop();
        await kafkaPublisher.disconnect();
        server.close(() => {
            PostgresConnection_1.pool.end().then(() => {
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