// Infrastructure: User Cache Repository
import { Pool } from "pg";
import { UserCache } from "../../domain/entities/UserCache";

export class UserCacheRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async upsert(userCache: UserCache): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, org_id, email, name, phone, synced_at, source_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         synced_at = EXCLUDED.synced_at,
         source_updated_at = EXCLUDED.source_updated_at`,
      [
        userCache.id,
        userCache.orgId,
        userCache.email,
        userCache.name,
        userCache.phone || null,
        userCache.syncedAt,
        userCache.sourceUpdatedAt,
      ],
    );
  }

  async findById(id: string): Promise<UserCache | null> {
    const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findAll(): Promise<UserCache[]> {
    const result = await this.pool.query(
      "SELECT * FROM users ORDER BY synced_at DESC",
    );
    return result.rows.map(this.mapRow);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query("DELETE FROM users WHERE id = $1", [id]);
  }

  private mapRow(row: any): UserCache {
    return {
      id: row.id,
      orgId: row.org_id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      syncedAt: row.synced_at,
      sourceUpdatedAt: row.source_updated_at,
    };
  }
}
