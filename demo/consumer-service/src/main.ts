// Main Entry Point - Consumer Service
import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import express from "express";
import { SyncUserUseCase } from "./application/use-cases/SyncUserUseCase";
import { ReferenceApiClient } from "./infrastructure/http/ReferenceApiClient";
import { UserCacheRepository } from "./infrastructure/database/UserCacheRepository";
import { UserEventConsumer } from "./infrastructure/kafka/UserEventConsumer";

const PORT = parseInt(process.env.PORT || "8002");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "demo",
  password: process.env.DB_PASSWORD || "demo123",
  database: process.env.DB_NAME || "consumer_db",
});

async function main() {
  console.log("Starting Consumer Service...");

  // Initialize dependencies
  const referenceApiClient = new ReferenceApiClient(
    process.env.SOURCE_SERVICE_URL || "http://localhost:8001",
    "consumer-service",
  );
  const userCacheRepository = new UserCacheRepository(pool);
  const syncUseCase = new SyncUserUseCase(
    referenceApiClient,
    userCacheRepository,
  );
  const kafkaConsumer = new UserEventConsumer(syncUseCase);

  // Simple health endpoint
  const app = express();
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API to view cached users
  app.get("/cache/users", async (req, res) => {
    try {
      const users = await userCacheRepository.findAll();
      res.json({ data: users });
    } catch (error) {
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
