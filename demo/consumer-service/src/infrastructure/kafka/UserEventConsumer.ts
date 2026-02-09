// Infrastructure: Kafka Consumer
import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import {
  SyncUserUseCase,
  SyncEvent,
} from "../../application/use-cases/SyncUserUseCase";

export class UserEventConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private syncUseCase: SyncUserUseCase;
  private running: boolean = false;

  constructor(
    syncUseCase: SyncUserUseCase,
    groupId: string = "consumer-service",
  ) {
    this.syncUseCase = syncUseCase;
    this.kafka = new Kafka({
      clientId: "consumer-service",
      brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
    });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async start(topic: string = "user-events"): Promise<void> {
    if (this.running) return;

    await this.consumer.connect();
    await this.consumer.subscribe({ topic, fromBeginning: false });

    this.running = true;
    console.log(`Kafka consumer started, subscribed to: ${topic}`);

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        console.warn("Received empty message, skipping");
        return;
      }

      const rawEvent = JSON.parse(message.value.toString());

      // Map to SyncEvent format
      const event: SyncEvent = {
        eventId: rawEvent.event_id,
        entity: rawEvent.entity,
        action: rawEvent.action,
        timestamp: rawEvent.timestamp,
        sourceSystem: rawEvent.source_system,
        tenantContext: {
          orgId: rawEvent.tenant_context?.org_id,
        },
      };

      // Validate tenant context (Checkpoint 4 - Consumer Side)
      if (!event.tenantContext.orgId) {
        console.error("Message missing org_id, rejecting:", event.eventId);
        return;
      }

      console.log(
        `Processing event: ${event.eventId} (${event.entity.type}:${event.action})`,
      );

      await this.syncUseCase.execute(event);
    } catch (error) {
      console.error("Error processing message:", error, {
        topic,
        partition,
        offset: message.offset,
      });
      // In production, would send to DLQ
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    await this.consumer.disconnect();
    this.running = false;
    console.log("Kafka consumer stopped");
  }
}
