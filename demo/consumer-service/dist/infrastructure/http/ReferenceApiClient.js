"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceApiClient = void 0;
// Infrastructure: Reference API Client with Retry
const axios_1 = __importDefault(require("axios"));
class ReferenceApiClient {
    client;
    consumerId;
    maxRetries;
    baseDelay;
    constructor(baseUrl = "http://localhost:8001", consumerId = "consumer-service", maxRetries = 3, baseDelay = 1000) {
        this.consumerId = consumerId;
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 5000,
        });
    }
    async fetchUser(userId, tenantId) {
        let lastError = null;
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await this.client.get(`/internal/sync/user/${userId}`, {
                    headers: {
                        "X-Tenant-ID": tenantId,
                        "X-Consumer-ID": this.consumerId,
                    },
                });
                return response.data.data;
            }
            catch (error) {
                lastError = error;
                const axiosError = error;
                // Don't retry on auth errors
                if (axiosError.response?.status === 401 ||
                    axiosError.response?.status === 403) {
                    console.error(`Auth error fetching user ${userId}: ${axiosError.message}`);
                    throw error;
                }
                // Don't retry on 404 after first attempt (dead letter)
                if (axiosError.response?.status === 404 && attempt > 0) {
                    console.warn(`User ${userId} not found after retry, giving up`);
                    return null;
                }
                // Exponential backoff for retryable errors
                const delay = this.baseDelay * Math.pow(1.5, attempt);
                console.log(`Retry ${attempt + 1}/${this.maxRetries} for user ${userId} in ${delay}ms`);
                await this.sleep(delay);
            }
        }
        console.error(`Failed to fetch user ${userId} after ${this.maxRetries} retries`, lastError);
        throw lastError;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.ReferenceApiClient = ReferenceApiClient;
//# sourceMappingURL=ReferenceApiClient.js.map