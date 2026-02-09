// Domain Entity: User Cache (local copy of synced user data)
export interface UserCache {
  id: string;
  orgId: string;
  email: string;
  name: string;
  phone?: string;
  syncedAt: Date;
  sourceUpdatedAt: Date;
}
