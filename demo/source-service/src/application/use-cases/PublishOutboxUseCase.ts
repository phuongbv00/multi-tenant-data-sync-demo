// Use Case: Publish Outbox Events
import { IOutboxRepository } from "../../domain/repositories/IOutboxRepository";
import { IMessagePublisher } from "../interfaces/IMessagePublisher";

export class PublishOutboxUseCase {
  constructor(
    private outboxRepository: IOutboxRepository,
    private messagePublisher: IMessagePublisher,
  ) {}

  async execute(batchSize: number = 50): Promise<number> {
    // Fetch pending events with lock (FOR UPDATE SKIP LOCKED)
    const events = await this.outboxRepository.fetchPendingWithLock(batchSize);

    if (events.length === 0) {
      return 0;
    }

    try {
      // Publish to Kafka
      await this.messagePublisher.publish("user-events", events);

      // Mark as published
      const ids = events.map((e) => e.id);
      await this.outboxRepository.markAsPublished(ids);

      return events.length;
    } catch (error) {
      // Transaction will be rolled back by caller
      throw error;
    }
  }
}
