// Unit Test: Publish Outbox Use Case
import { PublishOutboxUseCase } from "../../source-service/src/application/use-cases/PublishOutboxUseCase";
import { IOutboxRepository } from "../../source-service/src/domain/repositories/IOutboxRepository";
import { IMessagePublisher } from "../../source-service/src/application/interfaces/IMessagePublisher";
import { OutboxEvent } from "../../source-service/src/domain/entities/OutboxEvent";

describe("PublishOutboxUseCase", () => {
  let useCase: PublishOutboxUseCase;
  let mockOutboxRepo: jest.Mocked<IOutboxRepository>;
  let mockPublisher: jest.Mocked<IMessagePublisher>;

  const mockEvents: OutboxEvent[] = [
    {
      id: "event-1",
      aggregateType: "USER",
      aggregateId: "user-123",
      eventType: "INSERT",
      payload: { org_id: "org-456" },
      status: "PENDING",
      createdAt: new Date(),
    },
    {
      id: "event-2",
      aggregateType: "USER",
      aggregateId: "user-456",
      eventType: "UPDATE",
      payload: { org_id: "org-456" },
      status: "PENDING",
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockOutboxRepo = {
      fetchPendingWithLock: jest.fn(),
      markAsPublished: jest.fn(),
      findById: jest.fn(),
    };
    mockPublisher = {
      publish: jest.fn(),
      disconnect: jest.fn(),
    };
    useCase = new PublishOutboxUseCase(mockOutboxRepo, mockPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 0 when no pending events", async () => {
    mockOutboxRepo.fetchPendingWithLock.mockResolvedValue([]);

    const count = await useCase.execute(50);

    expect(count).toBe(0);
    expect(mockPublisher.publish).not.toHaveBeenCalled();
    expect(mockOutboxRepo.markAsPublished).not.toHaveBeenCalled();
  });

  it("should publish events and mark as published", async () => {
    mockOutboxRepo.fetchPendingWithLock.mockResolvedValue(mockEvents);
    mockPublisher.publish.mockResolvedValue();
    mockOutboxRepo.markAsPublished.mockResolvedValue();

    const count = await useCase.execute(50);

    expect(count).toBe(2);
    expect(mockOutboxRepo.fetchPendingWithLock).toHaveBeenCalledWith(50);
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      "user-events",
      mockEvents,
    );
    expect(mockOutboxRepo.markAsPublished).toHaveBeenCalledWith([
      "event-1",
      "event-2",
    ]);
  });

  it("should throw error and not mark as published when publish fails", async () => {
    mockOutboxRepo.fetchPendingWithLock.mockResolvedValue(mockEvents);
    mockPublisher.publish.mockRejectedValue(new Error("Kafka error"));

    await expect(useCase.execute(50)).rejects.toThrow("Kafka error");
    expect(mockOutboxRepo.markAsPublished).not.toHaveBeenCalled();
  });

  it("should respect batch size parameter", async () => {
    mockOutboxRepo.fetchPendingWithLock.mockResolvedValue([]);

    await useCase.execute(10);

    expect(mockOutboxRepo.fetchPendingWithLock).toHaveBeenCalledWith(10);
  });
});
