"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgUserRepository = void 0;
class PgUserRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    mapRow(row) {
        return {
            id: row.id,
            orgId: row.org_id,
            email: row.email,
            name: row.name,
            phone: row.phone,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    async findById(id) {
        const result = await this.client.query("SELECT * FROM users WHERE id = $1", [id]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async findByEmail(email) {
        const result = await this.client.query("SELECT * FROM users WHERE email = $1", [email]);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async findAll() {
        const result = await this.client.query("SELECT * FROM users ORDER BY created_at DESC");
        return result.rows.map(this.mapRow);
    }
    async create(input) {
        const result = await this.client.query(`INSERT INTO users (org_id, email, name, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`, [input.orgId, input.email, input.name, input.phone || null]);
        return this.mapRow(result.rows[0]);
    }
    async update(id, input) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (input.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(input.name);
        }
        if (input.phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(input.phone);
        }
        if (updates.length === 0) {
            return this.findById(id);
        }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        const result = await this.client.query(`UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`, values);
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
    async delete(id) {
        const result = await this.client.query("DELETE FROM users WHERE id = $1", [
            id,
        ]);
        return (result.rowCount ?? 0) > 0;
    }
}
exports.PgUserRepository = PgUserRepository;
//# sourceMappingURL=PgUserRepository.js.map