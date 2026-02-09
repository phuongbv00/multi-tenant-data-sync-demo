import { Pool } from "pg";
import { IMessagePublisher } from "../../application/interfaces/IMessagePublisher";
export declare class OutboxPollingWorker {
    private pool;
    private publisher;
    private intervalMs;
    private batchSize;
    private running;
    private timer;
    constructor(pool: Pool, publisher: IMessagePublisher, intervalMs?: number, batchSize?: number);
    start(): Promise<void>;
    private poll;
    private processOutbox;
    stop(): Promise<void>;
}
//# sourceMappingURL=OutboxPollingWorker.d.ts.map