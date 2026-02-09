"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserUseCase = void 0;
class GetUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(id) {
        return this.userRepository.findById(id);
    }
    async executeAll() {
        return this.userRepository.findAll();
    }
}
exports.GetUserUseCase = GetUserUseCase;
//# sourceMappingURL=GetUserUseCase.js.map