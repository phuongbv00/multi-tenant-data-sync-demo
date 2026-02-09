// Presentation: User Controller
import { Request, Response } from "express";
import { Pool } from "pg";
import { TenantRequest } from "../middleware/TenantContextMiddleware";
import { TenantContextService } from "../../../application/services/TenantContextService";
import { CreateUserUseCase } from "../../../application/use-cases/CreateUserUseCase";
import { GetUserUseCase } from "../../../application/use-cases/GetUserUseCase";
import { PgUserRepository } from "../../../infrastructure/database/repositories/PgUserRepository";

export class UserController {
  private pool: Pool;
  private tenantService: TenantContextService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.tenantService = new TenantContextService(pool);
  }

  // GET /users
  async getAll(req: TenantRequest, res: Response): Promise<void> {
    try {
      const context = req.tenantContext!;

      const users = await this.tenantService.executeInContext(
        context,
        async (client) => {
          const repo = new PgUserRepository(client);
          const useCase = new GetUserUseCase(repo);
          return useCase.executeAll();
        },
      );

      res.json({ data: users });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // GET /users/:id
  async getById(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const context = req.tenantContext!;

      const user = await this.tenantService.executeInContext(
        context,
        async (client) => {
          const repo = new PgUserRepository(client);
          const useCase = new GetUserUseCase(repo);
          return useCase.execute(id);
        },
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ data: user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // POST /users
  async create(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { email, name, phone } = req.body;
      const context = req.tenantContext!;

      if (!email || !name) {
        res.status(400).json({ error: "email and name are required" });
        return;
      }

      const user = await this.tenantService.executeInContext(
        context,
        async (client) => {
          const repo = new PgUserRepository(client);
          const useCase = new CreateUserUseCase(repo);
          return useCase.execute({
            orgId: context.tenantId.getValue(),
            email,
            name,
            phone,
          });
        },
      );

      res.status(201).json({ data: user });
    } catch (error: any) {
      console.error("Create user error:", error);
      if (error.message?.includes("already exists")) {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
