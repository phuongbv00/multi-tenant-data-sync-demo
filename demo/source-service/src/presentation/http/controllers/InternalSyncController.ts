// Presentation: Internal Sync Controller
// Reference API for S2S communication (Checkpoint 3)
import { Request, Response } from "express";
import { Pool } from "pg";
import { TenantRequest } from "../middleware/TenantContextMiddleware";
import { TenantContextService } from "../../../application/services/TenantContextService";
import { GetUserUseCase } from "../../../application/use-cases/GetUserUseCase";
import { PgUserRepository } from "../../../infrastructure/database/repositories/PgUserRepository";

export class InternalSyncController {
  private pool: Pool;
  private tenantService: TenantContextService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.tenantService = new TenantContextService(pool);
  }

  // GET /internal/sync/user/:id
  // Returns full user data (including PII) for consumer services
  async getUserForSync(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = req.tenantContext!;

      // Validate consumer identity (from mTLS cert or service token)
      const consumerId = req.headers["x-consumer-id"] as string;
      if (!consumerId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Missing X-Consumer-ID header",
        });
        return;
      }

      console.log(`Sync request from consumer: ${consumerId} for user: ${id}`);

      const user = await this.tenantService.executeInContext(
        context,
        async (client) => {
          const repo = new PgUserRepository(client);
          const useCase = new GetUserUseCase(repo);
          return useCase.execute(id);
        },
      );

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
    } catch (error) {
      console.error("Sync user error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
