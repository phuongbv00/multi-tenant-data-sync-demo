// Use Case: Create User
import { User, CreateUserInput } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
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
