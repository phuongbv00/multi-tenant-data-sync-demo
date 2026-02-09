"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalSyncController = void 0;
const TenantContextService_1 = require("../../../application/services/TenantContextService");
const GetUserUseCase_1 = require("../../../application/use-cases/GetUserUseCase");
const PgUserRepository_1 = require("../../../infrastructure/database/repositories/PgUserRepository");
class InternalSyncController {
    pool;
    tenantService;
    constructor(pool) {
        this.pool = pool;
        this.tenantService = new TenantContextService_1.TenantContextService(pool);
    }
    // GET /internal/sync/user/:id
    // Returns full user data (including PII) for consumer services
    async getUserForSync(req, res) {
        try {
            const { id } = req.params;
            const context = req.tenantContext;
            // Validate consumer identity (from mTLS cert or service token)
            const consumerId = req.headers["x-consumer-id"];
            if (!consumerId) {
                res.status(401).json({
                    error: "Unauthorized",
                    message: "Missing X-Consumer-ID header",
                });
                return;
            }
            console.log(`Sync request from consumer: ${consumerId} for user: ${id}`);
            const user = await this.tenantService.executeInContext(context, async (client) => {
                const repo = new PgUserRepository_1.PgUserRepository(client);
                const useCase = new GetUserUseCase_1.GetUserUseCase(repo);
                return useCase.execute(id);
            });
            if (!user) {
                res.status(404).json({
                    error: "Not Found",
                    message: `User ${id} not found in tenant ${context.tenantId.getValue()}`,
                });
                return;
            }
            // Return full data (PII included) - secured by mTLS
            res.json({
                data: user,
                _meta: {
                    tenant_id: context.tenantId.getValue(),
                    retrieved_at: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            console.error("Sync user error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
exports.InternalSyncController = InternalSyncController;
//# sourceMappingURL=InternalSyncController.js.map