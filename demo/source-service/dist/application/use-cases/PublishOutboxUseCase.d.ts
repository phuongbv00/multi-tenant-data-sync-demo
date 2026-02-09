import { IOutboxRepository } from "../../domain/repositories/IOutboxRepository";
import { IMessagePublisher } from "../interfaces/IMessagePublisher";
export declare class PublishOutboxUseCase {
    private outboxRepository;
    private messagePublisher;
    constructor(outboxRepository: IOutboxRepository, messagePublisher: IMessagePublisher);
    execute(batchSize?: number): Promise<number>;
}
//# sourceMappingURL=PublishOutboxUseCase.d.ts.map