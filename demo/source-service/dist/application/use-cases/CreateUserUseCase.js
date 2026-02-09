"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserUseCase = void 0;
class CreateUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(input) {
        // Business rule: Check if email already exists
        const existing = await this.userRepository.findByEmail(input.email);
        if (existing) {
            throw new Error(`User with email ${input.email} already exists`);
        }
        // Create user (outbox entry is automatically created via DB trigger)
        const user = await this.userRepository.create(input);
        return user;
    }
}
exports.CreateUserUseCase = CreateUserUseCase;
//# sourceMappingURL=CreateUserUseCase.js.map