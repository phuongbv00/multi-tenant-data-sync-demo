// Infrastructure: Reference API Client with Retry
import axios, { AxiosInstance, AxiosError } from "axios";

interface UserData {
  id: string;
  orgId: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export class ReferenceApiClient {
  private client: AxiosInstance;
  private consumerId: string;
  private maxRetries: number;
  private baseDelay: number;

  constructor(
    baseUrl: string = "http://localhost:8001",
    consumerId: string = "consumer-service",
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ) {
    this.consumerId = consumerId;
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
    });
  }

  async fetchUser(userId: string, tenantId: string): Promise<UserData | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.get(
          `/internal/sync/user/${userId}`,
          {
            headers: {
              "X-Tenant-ID": tenantId,
              "X-Consumer-ID": this.consumerId,
            },
          },
        );

        return response.data.data as UserData;
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        // Don't retry on auth errors
        if (
          axiosError.response?.status === 401 ||
          axiosError.response?.status === 403
        ) {
          console.error(
            `Auth error fetching user ${userId}: ${axiosError.message}`,
          );
          throw error;
        }

        // Don't retry on 404 after first attempt (dead letter)
        if (axiosError.response?.status === 404 && attempt > 0) {
          console.warn(`User ${userId} not found after retry, giving up`);
          return null;
        }

        // Exponential backoff for retryable errors
        const delay = this.baseDelay * Math.pow(1.5, attempt);
        console.log(
          `Retry ${attempt + 1}/${this.maxRetries} for user ${userId} in ${delay}ms`,
        );
        await this.sleep(delay);
      }
    }

    console.error(
      `Failed to fetch user ${userId} after ${this.maxRetries} retries`,
      lastError,
    );
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
