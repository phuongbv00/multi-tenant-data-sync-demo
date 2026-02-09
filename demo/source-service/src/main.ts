// Main Entry Point - Source Service
import dotenv from "dotenv";
dotenv.config();

import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { pool } from "./infrastructure/database/PostgresConnection";
import { createServer, createInternalServer } from "./presentation/http/server";
import { KafkaPublisher } from "./infrastructure/messaging/KafkaPublisher";
import { OutboxPollingWorker } from "./infrastructure/workers/OutboxPollingWorker";

const PUBLIC_PORT = parseInt(process.env.PUBLIC_PORT || "8001");
const INTERNAL_PORT = parseInt(process.env.INTERNAL_PORT || "8441");

async function main() {
  console.log("Starting Source Service...");

  // Create Express apps
  const publicApp = createServer(pool); // Public API (HTTP)
  const internalApp = createInternalServer(pool); // Internal API (mTLS)

  // Create Kafka publisher and outbox worker
  const kafkaPublisher = new KafkaPublisher();
  const outboxWorker = new OutboxPollingWorker(pool, kafkaPublisher, 500, 50);

  // 1. Start Public HTTP Server (for client-to-service)
  const publicServer = http.createServer(publicApp);
  publicServer.listen(PUBLIC_PORT, () => {
    console.log(`Public API running on HTTP port ${PUBLIC_PORT}`);
  });

  // 2. Start Internal HTTPS Server with mTLS (for service-to-service)
  const certsDir = path.resolve(__dirname, "../../certs");
  const httpsOptions: https.ServerOptions = {
    key: fs.readFileSync(path.join(certsDir, "server.key")),
    cert: fs.readFileSync(path.join(certsDir, "server.crt")),
    ca: fs.readFileSync(path.join(certsDir, "ca.crt")),
    requestCert: true, // Require client certificate
    rejectUnauthorized: true, // Reject if client cert is invalid
  };

  const internalServer = https.createServer(httpsOptions, internalApp);
  internalServer.listen(INTERNAL_PORT, () => {
    console.log(`Internal API running on HTTPS (mTLS) port ${INTERNAL_PORT}`);
  });

  // Start outbox worker
  await outboxWorker.start();

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...");

    await outboxWorker.stop();
    await kafkaPublisher.disconnect();

    publicServer.close();
    internalServer.close(() => {
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
