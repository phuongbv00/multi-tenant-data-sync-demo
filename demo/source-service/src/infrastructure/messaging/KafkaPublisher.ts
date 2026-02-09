// Infrastructure: Kafka Publisher
import { Kafka, Producer, Message } from "kafkajs";
import { IMessagePublisher } from "../../application/interfaces/IMessagePublisher";
import { OutboxEvent } from "../../domain/entities/OutboxEvent";

export class KafkaPublisher implements IMessagePublisher {
  private kafka: Kafka;
  private producer: Producer;
  private connected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: "source-service",
      brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
    });
    this.producer = this.kafka.producer();
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
      console.log("Kafka producer connected");
    }
  }

  async publish(topic: string, events: OutboxEvent[]): Promise<void> {
    await this.ensureConnected();

    const messages: Message[] = events.map((event) => ({
      key: event.aggregateId,
      value: JSON.stringify({
        event_id: event.id,
        entity: {
          type: event.aggregateType,
          id: event.aggregateId,
        },
        action: event.eventType,
        timestamp: event.createdAt.toISOString(),
        source_system: "SOURCE_SERVICE",
        tenant_context: {
          org_id: event.payload.org_id,
        },
      }),
      headers: {
        "content-type": "application/json",
        "event-type": event.eventType,
      },
    }));

    await this.producer.send({
      topic,
      messages,
    });

    console.log(`Published ${events.length} events to ${topic}`);
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log("Kafka producer disconnected");
    }
  }
}
