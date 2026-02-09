import { User, CreateUserInput } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
export declare class CreateUserUseCase {
    private userRepository;
    constructor(userRepository: IUserRepository);
    execute(input: CreateUserInput): Promise<User>;
}
//# sourceMappingURL=CreateUserUseCase.d.ts.map