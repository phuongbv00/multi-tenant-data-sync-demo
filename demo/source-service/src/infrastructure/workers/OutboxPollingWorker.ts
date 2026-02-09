// Infrastructure: Outbox Polling Worker
import { Pool } from "pg";
import { PgOutboxRepository } from "../database/repositories/PgOutboxRepository";
import { PublishOutboxUseCase } from "../../application/use-cases/PublishOutboxUseCase";
import { IMessagePublisher } from "../../application/interfaces/IMessagePublisher";

export class OutboxPollingWorker {
  private pool: Pool;
  private publisher: IMessagePublisher;
  private intervalMs: number;
  private batchSize: number;
  private running: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    pool: Pool,
    publisher: IMessagePublisher,
    intervalMs: number = 500,
    batchSize: number = 50,
  ) {
    this.pool = pool;
    this.publisher = publisher;
    this.intervalMs = intervalMs;
    this.batchSize = batchSize;
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log("Outbox worker already running");
      return;
    }

    this.running = true;
    console.log(
      `Outbox worker started (interval: ${this.intervalMs}ms, batch: ${this.batchSize})`,
    );

    await this.poll();
  }

  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      await this.processOutbox();
    } catch (error) {
      console.error("Outbox processing error:", error);
    }

    // Schedule next poll
    this.timer = setTimeout(() => this.poll(), this.intervalMs);
  }

  private async processOutbox(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const outboxRepo = new PgOutboxRepository(client);
      const useCase = new PublishOutboxUseCase(outboxRepo, this.publisher);

      const count = await useCase.execute(this.batchSize);

      await client.query("COMMIT");

      if (count > 0) {
        console.log(`Published ${count} outbox events`);
      }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async stop(): Promise<void> {
    this.running = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    console.log("Outbox worker stopped");
  }
}
