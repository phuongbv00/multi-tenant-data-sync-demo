import { Response } from "express";
import { Pool } from "pg";
import { TenantRequest } from "../middleware/TenantContextMiddleware";
export declare class UserController {
    private pool;
    private tenantService;
    constructor(pool: Pool);
    getAll(req: TenantRequest, res: Response): Promise<void>;
    getById(req: TenantRequest, res: Response): Promise<void>;
    create(req: TenantRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=UserController.d.ts.map