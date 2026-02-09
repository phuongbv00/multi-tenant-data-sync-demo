interface UserData {
    id: string;
    orgId: string;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
}
export declare class ReferenceApiClient {
    private client;
    private consumerId;
    private maxRetries;
    private baseDelay;
    constructor(baseUrl?: string, consumerId?: string, maxRetries?: number, baseDelay?: number);
    fetchUser(userId: string, tenantId: string): Promise<UserData | null>;
    private sleep;
}
export {};
