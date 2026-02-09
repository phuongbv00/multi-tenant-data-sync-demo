// Infrastructure: PostgreSQL Outbox Repository
import { PoolClient } from "pg";
import { IOutboxRepository } from "../../../domain/repositories/IOutboxRepository";
import {
  OutboxEvent,
  OutboxStatus,
  EventType,
} from "../../../domain/entities/OutboxEvent";

export class PgOutboxRepository implements IOutboxRepository {
  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  private mapRow(row: any): OutboxEvent {
    return {
      id: row.id,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      eventType: row.event_type as EventType,
      payload: row.payload,
      status: row.status as OutboxStatus,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    };
  }

  // Fetch pending events with FOR UPDATE SKIP LOCKED
  // This ensures multiple workers can run safely without duplicating events
  async fetchPendingWithLock(limit: number): Promise<OutboxEvent[]> {
    const result = await this.client.query(
      `SELECT * FROM outbox 
       WHERE status = 'PENDING' 
       ORDER BY created_at ASC 
       LIMIT $1 
       FOR UPDATE SKIP LOCKED`,
      [limit],
    );
    return result.rows.map(this.mapRow);
  }

  async markAsPublished(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.client.query(
      `UPDATE outbox 
       SET status = 'PUBLISHED', published_at = NOW() 
       WHERE id = ANY($1)`,
      [ids],
    );
  }

  async findById(id: string): Promise<OutboxEvent | null> {
    const result = await this.client.query(
      "SELECT * FROM outbox WHERE id = $1",
      [id],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }
}
