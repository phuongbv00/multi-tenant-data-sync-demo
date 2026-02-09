// Infrastructure: PostgreSQL User Repository
import { Pool, PoolClient } from "pg";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import {
  User,
  CreateUserInput,
  UpdateUserInput,
} from "../../../domain/entities/User";

export class PgUserRepository implements IUserRepository {
  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  private mapRow(row: any): User {
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

  async findById(id: string): Promise<User | null> {
    const result = await this.client.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const result = await this.client.query(
      "SELECT * FROM users ORDER BY created_at DESC",
    );
    return result.rows.map(this.mapRow);
  }

  async create(input: CreateUserInput): Promise<User> {
    const result = await this.client.query(
      `INSERT INTO users (org_id, email, name, phone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [input.orgId, input.email, input.name, input.phone || null],
    );
    return this.mapRow(result.rows[0]);
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
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

    const result = await this.client.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.client.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }
}
