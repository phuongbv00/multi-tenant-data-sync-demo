export interface UserCache {
    id: string;
    orgId: string;
    email: string;
    name: string;
    phone?: string;
    syncedAt: Date;
    sourceUpdatedAt: Date;
}
