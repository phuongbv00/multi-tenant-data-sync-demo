"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
// Presentation: Routes
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const InternalSyncController_1 = require("../controllers/InternalSyncController");
const TenantContextMiddleware_1 = require("../middleware/TenantContextMiddleware");
function createRoutes(pool) {
    const router = (0, express_1.Router)();
    const tenantMiddleware = (0, TenantContextMiddleware_1.createTenantContextMiddleware)(pool);
    const userController = new UserController_1.UserController(pool);
    const internalController = new InternalSyncController_1.InternalSyncController(pool);
    // Health check (no auth required)
    router.get("/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    // Public API (requires tenant context)
    router.get("/users", tenantMiddleware, (req, res) => userController.getAll(req, res));
    router.get("/users/:id", tenantMiddleware, (req, res) => userController.getById(req, res));
    router.post("/users", tenantMiddleware, (req, res) => userController.create(req, res));
    // Internal API (S2S - requires tenant context + consumer ID)
    router.get("/internal/sync/user/:id", tenantMiddleware, (req, res) => internalController.getUserForSync(req, res));
    return router;
}
//# sourceMappingURL=index.js.map