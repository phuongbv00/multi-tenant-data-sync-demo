// Presentation: Routes
import { Router } from "express";
import { Pool } from "pg";
import { UserController } from "../controllers/UserController";
import { InternalSyncController } from "../controllers/InternalSyncController";
import { createTenantContextMiddleware } from "../middleware/TenantContextMiddleware";

export function createRoutes(pool: Pool): Router {
  const router = Router();
  const tenantMiddleware = createTenantContextMiddleware(pool);

  const userController = new UserController(pool);
  const internalController = new InternalSyncController(pool);

  // Health check (no auth required)
  router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Public API (requires tenant context)
  router.get("/users", tenantMiddleware, (req, res) =>
    userController.getAll(req, res),
  );
  router.get("/users/:id", tenantMiddleware, (req, res) =>
    userController.getById(req, res),
  );
  router.post("/users", tenantMiddleware, (req, res) =>
    userController.create(req, res),
  );

  // Internal API (S2S - requires tenant context + consumer ID)
  router.get("/internal/sync/user/:id", tenantMiddleware, (req, res) =>
    internalController.getUserForSync(req, res),
  );

  return router;
}
