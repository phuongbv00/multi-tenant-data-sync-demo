import { TenantId } from "../../domain/value-objects/TenantId";
import { Pool, PoolClient } from "pg";
export interface TenantContext {
    tenantId: TenantId;
    role?: "admin" | "user";
}
export declare class TenantContextService {
    private pool;
    constructor(pool: Pool);
    setContext(client: PoolClient, context: TenantContext): Promise<void>;
    executeInContext<T>(context: TenantContext, callback: (client: PoolClient) => Promise<T>): Promise<T>;
}
//# sourceMappingURL=TenantContextService.d.ts.map