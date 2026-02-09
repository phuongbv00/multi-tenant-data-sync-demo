import { OutboxEvent } from "../entities/OutboxEvent";
export interface IOutboxRepository {
    fetchPendingWithLock(limit: number): Promise<OutboxEvent[]>;
    markAsPublished(ids: string[]): Promise<void>;
    findById(id: string): Promise<OutboxEvent | null>;
}
//# sourceMappingURL=IOutboxRepository.d.ts.map