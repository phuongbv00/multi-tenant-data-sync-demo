import { ReferenceApiClient } from "../../infrastructure/http/ReferenceApiClient";
import { UserCacheRepository } from "../../infrastructure/database/UserCacheRepository";
export interface SyncEvent {
    eventId: string;
    entity: {
        type: string;
        id: string;
    };
    action: string;
    timestamp: string;
    sourceSystem: string;
    tenantContext: {
        orgId: string;
    };
}
export declare class SyncUserUseCase {
    private referenceApiClient;
    private userCacheRepository;
    constructor(referenceApiClient: ReferenceApiClient, userCacheRepository: UserCacheRepository);
    execute(event: SyncEvent): Promise<void>;
}
