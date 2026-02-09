// Repository Interface: Outbox Repository
import { OutboxEvent } from "../entities/OutboxEvent";

export interface IOutboxRepository {
  // Fetch pending events with lock (FOR UPDATE SKIP LOCKED)
  fetchPendingWithLock(limit: number): Promise<OutboxEvent[]>;

  // Mark events as published
  markAsPublished(ids: string[]): Promise<void>;

  // For testing/debugging
  findById(id: string): Promise<OutboxEvent | null>;
}
