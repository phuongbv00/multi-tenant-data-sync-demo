import { PoolClient } from "pg";
import { IOutboxRepository } from "../../../domain/repositories/IOutboxRepository";
import { OutboxEvent } from "../../../domain/entities/OutboxEvent";
export declare class PgOutboxRepository implements IOutboxRepository {
    private client;
    constructor(client: PoolClient);
    private mapRow;
    fetchPendingWithLock(limit: number): Promise<OutboxEvent[]>;
    markAsPublished(ids: string[]): Promise<void>;
    findById(id: string): Promise<OutboxEvent | null>;
}
//# sourceMappingURL=PgOutboxRepository.d.ts.map