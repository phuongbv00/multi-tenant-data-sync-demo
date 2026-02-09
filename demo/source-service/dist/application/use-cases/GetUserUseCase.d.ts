import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
export declare class GetUserUseCase {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(id: string): Promise<User | null>;
    executeAll(): Promise<User[]>;
}
//# sourceMappingURL=GetUserUseCase.d.ts.map