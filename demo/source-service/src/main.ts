// Main Entry Point - Source Service
import dotenv from "dotenv";
dotenv.config();

import { pool } from "./infrastructure/database/PostgresConnection";
import { createServer } from "./presentation/http/server";
import { KafkaPublisher } from "./infrastructure/messaging/KafkaPublisher";
import { OutboxPollingWorker } from "./infrastructure/workers/OutboxPollingWorker";

const PORT = parseInt(process.env.PORT || "8001");

async function main() {
  console.log("Starting Source Service...");

  // Create HTTP server
  const app = createServer(pool);

  // Create Kafka publisher and outbox worker
  const kafkaPublisher = new KafkaPublisher();
  const outboxWorker = new OutboxPollingWorker(pool, kafkaPublisher, 500, 50);

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
