import { IMessagePublisher } from "../../application/interfaces/IMessagePublisher";
import { OutboxEvent } from "../../domain/entities/OutboxEvent";
export declare class KafkaPublisher implements IMessagePublisher {
    private kafka;
    private producer;
    private connected;
    constructor();
    private ensureConnected;
    publish(topic: string, events: OutboxEvent[]): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=KafkaPublisher.d.ts.map