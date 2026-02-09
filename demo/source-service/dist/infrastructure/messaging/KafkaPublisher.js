"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaPublisher = void 0;
// Infrastructure: Kafka Publisher
const kafkajs_1 = require("kafkajs");
class KafkaPublisher {
    kafka;
    producer;
    connected = false;
    constructor() {
        this.kafka = new kafkajs_1.Kafka({
            clientId: "source-service",
            brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
        });
        this.producer = this.kafka.producer();
    }
    async ensureConnected() {
        if (!this.connected) {
            await this.producer.connect();
            this.connected = true;
            console.log("Kafka producer connected");
        }
    }
    async publish(topic, events) {
        await this.ensureConnected();
        const messages = events.map((event) => ({
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
    async disconnect() {
        if (this.connected) {
            await this.producer.disconnect();
            this.connected = false;
            console.log("Kafka producer disconnected");
        }
    }
}
exports.KafkaPublisher = KafkaPublisher;
//# sourceMappingURL=KafkaPublisher.js.map