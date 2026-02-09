export type OutboxStatus = "PENDING" | "PUBLISHED";
export type EventType = "INSERT" | "UPDATE" | "DELETE";
export interface OutboxEvent {
    id: string;
    aggregateType: string;
    aggregateId: string;
    eventType: EventType;
    payload: Record<string, unknown>;
    status: OutboxStatus;
    createdAt: Date;
    publishedAt?: Date;
}
export interface OutboxEventPayload {
    orgId: string;
    timestamp: string;
}
//# sourceMappingURL=OutboxEvent.d.ts.map