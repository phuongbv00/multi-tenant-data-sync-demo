"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCacheRepository = void 0;
class UserCacheRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async upsert(userCache) {
        await this.pool.query(`INSERT INTO user_cache (id, org_id, email, name, phone, synced_at, source_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         synced_at = EXCLUDED.synced_at,
         source_updated_at = EXCLUDED.source_updated_at`, [
            userCache.id,
            userCache.orgId,
            userCache.email,
            userCache.name,
            userCache.phone || null,
            userCache.syncedAt,
            userCache.sourceUpdatedAt,
        ]);
    }
    async findById(id) {
        const result = await this.pool.query("SELECT * FROM user_cache WHERE id = $1", [id]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async findAll() {
        const result = await this.pool.query("SELECT * FROM user_cache ORDER BY synced_at DESC");
        return result.rows.map(this.mapRow);
    }
    async delete(id) {
        await this.pool.query("DELETE FROM user_cache WHERE id = $1", [id]);
    }
    mapRow(row) {
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
exports.UserCacheRepository = UserCacheRepository;
//# sourceMappingURL=UserCacheRepository.js.map