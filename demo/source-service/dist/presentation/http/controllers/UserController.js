"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const TenantContextService_1 = require("../../../application/services/TenantContextService");
const CreateUserUseCase_1 = require("../../../application/use-cases/CreateUserUseCase");
const GetUserUseCase_1 = require("../../../application/use-cases/GetUserUseCase");
const PgUserRepository_1 = require("../../../infrastructure/database/repositories/PgUserRepository");
class UserController {
    pool;
    tenantService;
    constructor(pool) {
        this.pool = pool;
        this.tenantService = new TenantContextService_1.TenantContextService(pool);
    }
    // GET /users
    async getAll(req, res) {
        try {
            const context = req.tenantContext;
            const users = await this.tenantService.executeInContext(context, async (client) => {
                const repo = new PgUserRepository_1.PgUserRepository(client);
                const useCase = new GetUserUseCase_1.GetUserUseCase(repo);
                return useCase.executeAll();
            });
            res.json({ data: users });
        }
        catch (error) {
            console.error("Get users error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    // GET /users/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const context = req.tenantContext;
            const user = await this.tenantService.executeInContext(context, async (client) => {
                const repo = new PgUserRepository_1.PgUserRepository(client);
                const useCase = new GetUserUseCase_1.GetUserUseCase(repo);
                return useCase.execute(id);
            });
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            res.json({ data: user });
        }
        catch (error) {
            console.error("Get user error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    // POST /users
    async create(req, res) {
        try {
            const { email, name, phone } = req.body;
            const context = req.tenantContext;
            if (!email || !name) {
                res.status(400).json({ error: "email and name are required" });
                return;
            }
            const user = await this.tenantService.executeInContext(context, async (client) => {
                const repo = new PgUserRepository_1.PgUserRepository(client);
                const useCase = new CreateUserUseCase_1.CreateUserUseCase(repo);
                return useCase.execute({
                    orgId: context.tenantId.getValue(),
                    email,
                    name,
                    phone,
                });
            });
            res.status(201).json({ data: user });
        }
        catch (error) {
            console.error("Create user error:", error);
            if (error.message?.includes("already exists")) {
                res.status(409).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map