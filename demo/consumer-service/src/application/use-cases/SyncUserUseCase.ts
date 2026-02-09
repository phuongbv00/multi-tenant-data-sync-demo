// Application: Sync User Use Case
import { UserCache } from "../../domain/entities/UserCache";
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

export class SyncUserUseCase {
  constructor(
    private referenceApiClient: ReferenceApiClient,
    private userCacheRepository: UserCacheRepository,
  ) {}

  async execute(event: SyncEvent): Promise<void> {
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
    const userData = await this.referenceApiClient.fetchUser(
      entity.id,
      tenantContext.orgId,
    );

    if (!userData) {
      console.warn(`User ${entity.id} not found in source, skipping`);
      return;
    }

    // Upsert to local cache
    const userCache: UserCache = {
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
