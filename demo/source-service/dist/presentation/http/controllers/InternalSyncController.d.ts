import { Response } from "express";
import { Pool } from "pg";
import { TenantRequest } from "../middleware/TenantContextMiddleware";
export declare class InternalSyncController {
    private pool;
    private tenantService;
    constructor(pool: Pool);
    getUserForSync(req: TenantRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=InternalSyncController.d.ts.map