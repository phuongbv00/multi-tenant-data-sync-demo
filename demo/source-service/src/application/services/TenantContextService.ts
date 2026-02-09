// Application Service: Tenant Context Service
import { TenantId } from "../../domain/value-objects/TenantId";
import { Pool, PoolClient } from "pg";

export interface TenantContext {
  tenantId: TenantId;
  role?: "admin" | "user";
}

export class TenantContextService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Set tenant context on a database client (for RLS)
  async setContext(client: PoolClient, context: TenantContext): Promise<void> {
    await client.query(
      `SET LOCAL app.current_tenant = '${context.tenantId.getValue()}'`,
    );

    if (context.role) {
      await client.query(`SET LOCAL app.role = '${context.role}'`);
    }
  }

  // Execute a callback within tenant context
  async executeInContext<T>(
    context: TenantContext,
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await this.setContext(client, context);

      const result = await callback(client);

      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
