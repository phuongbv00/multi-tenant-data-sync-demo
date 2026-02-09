import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { TenantId } from "../../../domain/value-objects/TenantId";
export interface TenantRequest extends Request {
    tenantContext?: {
        tenantId: TenantId;
        role?: "admin" | "user";
    };
}
export declare function createTenantContextMiddleware(pool: Pool): (req: TenantRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=TenantContextMiddleware.d.ts.map