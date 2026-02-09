"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncUserUseCase = void 0;
class SyncUserUseCase {
    referenceApiClient;
    userCacheRepository;
    constructor(referenceApiClient, userCacheRepository) {
        this.referenceApiClient = referenceApiClient;
        this.userCacheRepository = userCacheRepository;
    }
    async execute(event) {
        const { entity, tenantContext, action } = event;
        if (entity.type !== "USER") {
            console.log(`Skipping non-user event: ${entity.type}`);
            return;
        }
        if (action === "DELETE") {
            await this.userCacheRepository.delete(entity.id);
            console.log(`Deleted user cache: ${entity.id}`);
            return;
        }
        // Fetch full data from Reference API
        const userData = await this.referenceApiClient.fetchUser(entity.id, tenantContext.orgId);
        if (!userData) {
            console.warn(`User ${entity.id} not found in source, skipping`);
            return;
        }
        // Upsert to local cache
        const userCache = {
            id: userData.id,
            orgId: userData.orgId,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            syncedAt: new Date(),
            sourceUpdatedAt: new Date(userData.updatedAt),
        };
        await this.userCacheRepository.upsert(userCache);
        console.log(`Synced user: ${entity.id}`);
    }
}
exports.SyncUserUseCase = SyncUserUseCase;
//# sourceMappingURL=SyncUserUseCase.js.map