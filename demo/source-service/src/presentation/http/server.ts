// Presentation: HTTP Server
import express, { Application } from "express";
import { Pool } from "pg";
import { createRoutes } from "./routes";

export function createServer(pool: Pool): Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use(createRoutes(pool));

  // Error handler
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    },
  );

  return app;
}
