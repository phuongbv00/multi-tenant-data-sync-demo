"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxPollingWorker = void 0;
const PgOutboxRepository_1 = require("../database/repositories/PgOutboxRepository");
const PublishOutboxUseCase_1 = require("../../application/use-cases/PublishOutboxUseCase");
class OutboxPollingWorker {
    pool;
    publisher;
    intervalMs;
    batchSize;
    running = false;
    timer = null;
    constructor(pool, publisher, intervalMs = 500, batchSize = 50) {
        this.pool = pool;
        this.publisher = publisher;
        this.intervalMs = intervalMs;
        this.batchSize = batchSize;
    }
    async start() {
        if (this.running) {
            console.log("Outbox worker already running");
            return;
        }
        this.running = true;
        console.log(`Outbox worker started (interval: ${this.intervalMs}ms, batch: ${this.batchSize})`);
        await this.poll();
    }
    async poll() {
        if (!this.running)
            return;
        try {
            await this.processOutbox();
        }
        catch (error) {
            console.error("Outbox processing error:", error);
        }
        // Schedule next poll
        this.timer = setTimeout(() => this.poll(), this.intervalMs);
    }
    async processOutbox() {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const outboxRepo = new PgOutboxRepository_1.PgOutboxRepository(client);
            const useCase = new PublishOutboxUseCase_1.PublishOutboxUseCase(outboxRepo, this.publisher);
            const count = await useCase.execute(this.batchSize);
            await client.query("COMMIT");
            if (count > 0) {
                console.log(`Published ${count} outbox events`);
            }
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    async stop() {
        this.running = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        console.log("Outbox worker stopped");
    }
}
exports.OutboxPollingWorker = OutboxPollingWorker;
//# sourceMappingURL=OutboxPollingWorker.js.map