// Unit Test: Tenant Context Middleware
import { Request, Response, NextFunction } from "express";
import { Pool, PoolClient, QueryResult } from "pg";
import {
  createTenantContextMiddleware,
  TenantRequest,
} from "../../source-service/src/presentation/http/middleware/TenantContextMiddleware";

// Mock pg module
jest.mock("pg");

describe("TenantContextMiddleware", () => {
  let mockPool: jest.Mocked<Pool>;
  let mockClient: { query: jest.Mock; release: jest.Mock };
  let middleware: ReturnType<typeof createTenantContextMiddleware>;
  let mockReq: Partial<TenantRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Setup mocks
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as unknown as { query: jest.Mock; release: jest.Mock };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    } as unknown as jest.Mocked<Pool>;

    middleware = createTenantContextMiddleware(mockPool);

    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should reject request without X-Tenant-ID header", async () => {
    await middleware(mockReq as TenantRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Missing X-Tenant-ID header",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request with invalid tenant ID format", async () => {
    mockReq.headers = { "x-tenant-id": "invalid-uuid" };

    await middleware(mockReq as TenantRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Invalid tenant ID format",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject request when tenant not found", async () => {
    const validTenantId = "550e8400-e29b-41d4-a716-446655440000";
    mockReq.headers = { "x-tenant-id": validTenantId };
    mockClient.query.mockResolvedValue({ rows: [] } as unknown as QueryResult);

    await middleware(mockReq as TenantRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Tenant not found",
    });
  });

  it("should reject request when tenant is not active", async () => {
    const validTenantId = "550e8400-e29b-41d4-a716-446655440000";
    mockReq.headers = { "x-tenant-id": validTenantId };
    mockClient.query.mockResolvedValue({
      rows: [{ status: "INACTIVE" }],
    } as unknown as QueryResult);

    await middleware(mockReq as TenantRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Tenant is not active",
    });
  });

  it("should set tenant context and call next for valid request", async () => {
    const validTenantId = "550e8400-e29b-41d4-a716-446655440000";
    mockReq.headers = { "x-tenant-id": validTenantId };
    mockClient.query.mockResolvedValue({
      rows: [{ status: "ACTIVE" }],
    } as unknown as QueryResult);

    await middleware(mockReq as TenantRequest, mockRes as Response, mockNext);

    expect(mockReq.tenantContext).toBeDefined();
    expect(mockReq.tenantContext?.tenantId.getValue()).toBe(validTenantId);
    expect(mockNext).toHaveBeenCalled();
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should include role when X-User-Role header is present", async () => {
    const validTenantId = "550e8400-e29b-41d4-a716-446655440000";
    mockReq.headers = {
      "x-tenant-id": validTenantId,
      "x-user-role": "admin",
    };
    mockClient.query.mockResolvedValue({
      rows: [{ status: "ACTIVE" }],
    } as unknown as QueryResult);

    await middleware(mockReq as TenantRequest, mockRes as Response, mockNext);

    expect(mockReq.tenantContext?.role).toBe("admin");
    expect(mockNext).toHaveBeenCalled();
  });
});
