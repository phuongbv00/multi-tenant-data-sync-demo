// Application Interface: Message Publisher
import { OutboxEvent } from "../../domain/entities/OutboxEvent";

export interface IMessagePublisher {
  publish(topic: string, events: OutboxEvent[]): Promise<void>;
  disconnect(): Promise<void>;
}
