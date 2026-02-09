// Infrastructure: Dead Letter Queue Publisher
import { Kafka, Producer } from "kafkajs";

interface DLQMessage {
  originalTopic: string;
  partition: number;
  offset: string;
  message: any;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  timestamp: string;
  retryCount: number;
}

export class DLQPublisher {
  private kafka: Kafka;
  private producer: Producer;
  private connected: boolean = false;
  private dlqTopic: string;

  constructor(dlqTopic: string = "user-events-dlq") {
    this.dlqTopic = dlqTopic;
    this.kafka = new Kafka({
      clientId: "consumer-service-dlq",
      brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.producer.connect();
    this.connected = true;
    console.log(`DLQ Publisher connected to topic: ${this.dlqTopic}`);
  }

  async sendToDLQ(
    originalTopic: string,
    partition: number,
    offset: string,
    message: any,
    error: Error,
    retryCount: number = 0,
  ): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    const dlqMessage: DLQMessage = {
      originalTopic,
      partition,
      offset,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
      retryCount,
    };

    await this.producer.send({
      topic: this.dlqTopic,
      messages: [
        {
          key: `${originalTopic}-${partition}-${offset}`,
          value: JSON.stringify(dlqMessage),
          headers: {
            "x-original-topic": originalTopic,
            "x-error-type": error.name,
            "x-retry-count": String(retryCount),
          },
        },
      ],
    });

    console.log(
      `Sent message to DLQ: ${this.dlqTopic} (offset: ${offset}, error: ${error.message})`,
    );
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.producer.disconnect();
    this.connected = false;
    console.log("DLQ Publisher disconnected");
  }
}
