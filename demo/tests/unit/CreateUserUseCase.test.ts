// Unit Test: Create User Use Case
import { CreateUserUseCase } from "../../source-service/src/application/use-cases/CreateUserUseCase";
import { IUserRepository } from "../../source-service/src/domain/repositories/IUserRepository";
import {
  User,
  CreateUserInput,
} from "../../source-service/src/domain/entities/User";

describe("CreateUserUseCase", () => {
  let useCase: CreateUserUseCase;
  let mockRepository: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: "user-123",
    orgId: "org-456",
    email: "test@example.com",
    name: "Test User",
    phone: "123456789",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new CreateUserUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create user successfully when email does not exist", async () => {
    const input: CreateUserInput = {
      orgId: "org-456",
      email: "new@example.com",
      name: "New User",
    };

    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue({
      ...mockUser,
      ...input,
      id: "user-new",
    });

    const result = await useCase.execute(input);

    expect(mockRepository.findByEmail).toHaveBeenCalledWith("new@example.com");
    expect(mockRepository.create).toHaveBeenCalledWith(input);
    expect(result.email).toBe("new@example.com");
  });

  it("should throw error when email already exists", async () => {
    const input: CreateUserInput = {
      orgId: "org-456",
      email: "test@example.com",
      name: "Test User",
    };

    mockRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(useCase.execute(input)).rejects.toThrow(
      "User with email test@example.com already exists",
    );
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});
