import { Pool } from "pg";
import { UserCache } from "../../domain/entities/UserCache";
export declare class UserCacheRepository {
    private pool;
    constructor(pool: Pool);
    upsert(userCache: UserCache): Promise<void>;
    findById(id: string): Promise<UserCache | null>;
    findAll(): Promise<UserCache[]>;
    delete(id: string): Promise<void>;
    private mapRow;
}
