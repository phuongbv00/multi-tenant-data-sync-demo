"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgOutboxRepository = void 0;
class PgOutboxRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    mapRow(row) {
        return {
            id: row.id,
            aggregateType: row.aggregate_type,
            aggregateId: row.aggregate_id,
            eventType: row.event_type,
            payload: row.payload,
            status: row.status,
            createdAt: row.created_at,
            publishedAt: row.published_at,
        };
    }
    // Fetch pending events with FOR UPDATE SKIP LOCKED
    // This ensures multiple workers can run safely without duplicating events
    async fetchPendingWithLock(limit) {
        const result = await this.client.query(`SELECT * FROM outbox 
       WHERE status = 'PENDING' 
       ORDER BY created_at ASC 
       LIMIT $1 
       FOR UPDATE SKIP LOCKED`, [limit]);
        return result.rows.map(this.mapRow);
    }
    async markAsPublished(ids) {
        if (ids.length === 0)
            return;
        await this.client.query(`UPDATE outbox 
       SET status = 'PUBLISHED', published_at = NOW() 
       WHERE id = ANY($1)`, [ids]);
    }
    async findById(id) {
        const result = await this.client.query("SELECT * FROM outbox WHERE id = $1", [id]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
}
exports.PgOutboxRepository = PgOutboxRepository;
//# sourceMappingURL=PgOutboxRepository.js.map