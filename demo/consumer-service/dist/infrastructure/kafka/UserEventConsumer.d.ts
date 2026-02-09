import { SyncUserUseCase } from "../../application/use-cases/SyncUserUseCase";
export declare class UserEventConsumer {
    private kafka;
    private consumer;
    private syncUseCase;
    private running;
    constructor(syncUseCase: SyncUserUseCase, groupId?: string);
    start(topic?: string): Promise<void>;
    private handleMessage;
    stop(): Promise<void>;
}
