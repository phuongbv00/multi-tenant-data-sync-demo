import { PoolClient } from "pg";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { User, CreateUserInput, UpdateUserInput } from "../../../domain/entities/User";
export declare class PgUserRepository implements IUserRepository {
    private client;
    constructor(client: PoolClient);
    private mapRow;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    create(input: CreateUserInput): Promise<User>;
    update(id: string, input: UpdateUserInput): Promise<User | null>;
    delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=PgUserRepository.d.ts.map