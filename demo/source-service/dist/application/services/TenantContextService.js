"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextService = void 0;
class TenantContextService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    // Set tenant context on a database client (for RLS)
    async setContext(client, context) {
        await client.query("SET LOCAL app.current_tenant = $1", [
            context.tenantId.getValue(),
        ]);
        if (context.role) {
            await client.query("SET LOCAL app.role = $1", [context.role]);
        }
    }
    // Execute a callback within tenant context
    async executeInContext(context, callback) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            await this.setContext(client, context);
            const result = await callback(client);
            await client.query("COMMIT");
            return result;
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.TenantContextService = TenantContextService;
//# sourceMappingURL=TenantContextService.js.map