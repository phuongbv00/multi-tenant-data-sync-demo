"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishOutboxUseCase = void 0;
class PublishOutboxUseCase {
    outboxRepository;
    messagePublisher;
    constructor(outboxRepository, messagePublisher) {
        this.outboxRepository = outboxRepository;
        this.messagePublisher = messagePublisher;
    }
    async execute(batchSize = 50) {
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
        }
        catch (error) {
            // Transaction will be rolled back by caller
            throw error;
        }
    }
}
exports.PublishOutboxUseCase = PublishOutboxUseCase;
//# sourceMappingURL=PublishOutboxUseCase.js.map