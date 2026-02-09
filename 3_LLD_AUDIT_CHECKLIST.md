# Audit Checklist: LLD Implementation

Checklist để audit việc tuân thủ 2 LLD documents:

- **LLD 1:** Tenant Isolation Strategy
- **LLD 2:** Secure Data Synchronization

---

## 1. Tenant Isolation (LLD 1)

### Checkpoint 1: Client App (Defensive Check)

| #   | Tiêu Chí                                           | Pass/Fail | Ghi Chú |
| --- | -------------------------------------------------- | --------- | ------- |
| 1.1 | Client kiểm tra `org_id` tồn tại trước mọi request |           |         |
| 1.2 | Client chặn request nếu `org_id` không hợp lệ      |           |         |
| 1.3 | Không cache/hiển thị data nếu thiếu `org_id`       |           |         |

### Checkpoint 2: Service Inbound (Middleware/Filter)

| #   | Tiêu Chí                                 | Pass/Fail | Ghi Chú |
| --- | ---------------------------------------- | --------- | ------- |
| 2.1 | Mọi API endpoint yêu cầu Token           |           |         |
| 2.2 | Token được verify signature (chống MITM) |           |         |
| 2.3 | `org_id` được trích xuất từ Token claims |           |         |
| 2.4 | Header `X-Tenant-ID` được set từ Token   |           |         |
| 2.5 | Validate: Organization đang active       |           |         |
| 2.6 | Validate: User thuộc Organization        |           |         |
| 2.7 | Return `401` nếu validation fail         |           |         |

### Checkpoint 3: Service-to-Service (S2S)

| #   | Tiêu Chí                                                    | Pass/Fail | Ghi Chú |
| --- | ----------------------------------------------------------- | --------- | ------- |
| 3.1 | mTLS được enforce cho S2S communication                     |           |         |
| 3.2 | Dual-port architecture (TLS + mTLS)                         |           |         |
| 3.3 | `X-Tenant-ID` header được trích xuất và validate            |           |         |
| 3.4 | Client certificate được verify (`rejectUnauthorized: true`) |           |         |
| 3.5 | Server certificate được verify bởi client                   |           |         |

### Checkpoint 4: Service-to-Queue (Async Messaging)

| #   | Tiêu Chí                                              | Pass/Fail | Ghi Chú |
| --- | ----------------------------------------------------- | --------- | ------- |
| 4.1 | **Producer:** Message chứa `org_id` hợp lệ            |           |         |
| 4.2 | **Producer:** Chặn publish nếu thiếu `org_id`         |           |         |
| 4.3 | **Consumer:** Validate `org_id` khi nhận message      |           |         |
| 4.4 | **Consumer:** Từ chối xử lý nếu `org_id` không hợp lệ |           |         |
| 4.5 | Dead Letter Queue (DLQ) cho failed messages           |           |         |

### Checkpoint 5: Service-to-Database (Data Access)

| #   | Tiêu Chí                                                  | Pass/Fail | Ghi Chú |
| --- | --------------------------------------------------------- | --------- | ------- |
| 5.1 | RLS (Row Level Security) enabled cho các bảng có `org_id` |           |         |
| 5.2 | Policy USING clause kiểm tra `org_id` match context       |           |         |
| 5.3 | Policy WITH CHECK clause cho INSERT/UPDATE                |           |         |
| 5.4 | `SET LOCAL app.current_tenant` được gọi đầu transaction   |           |         |
| 5.5 | Admin role bypass có điều kiện kiểm soát                  |           |         |
| 5.6 | Index tồn tại cho cột `org_id`                            |           |         |

---

## 2. Secure Data Synchronization (LLD 2)

### Outbox Pattern Implementation

| #   | Tiêu Chí                                        | Pass/Fail | Ghi Chú |
| --- | ----------------------------------------------- | --------- | ------- |
| 6.1 | Outbox table schema đúng chuẩn                  |           |         |
| 6.2 | Dual write trong cùng 1 transaction (atomicity) |           |         |
| 6.3 | `FOR UPDATE SKIP LOCKED` cho concurrency safe   |           |         |
| 6.4 | Trigger tự động insert outbox (nếu dùng)        |           |         |
| 6.5 | Polling interval hợp lý (< 1s)                  |           |         |
| 6.6 | Status update sau khi publish thành công        |           |         |

### Reference-Based Sync

| #   | Tiêu Chí                                       | Pass/Fail | Ghi Chú |
| --- | ---------------------------------------------- | --------- | ------- |
| 7.1 | **Không gửi PII qua Message Queue**            |           |         |
| 7.2 | Message chỉ chứa reference (entity_id, action) |           |         |
| 7.3 | Consumer fetch full data qua Secure API        |           |         |
| 7.4 | `tenant_context.org_id` có trong mọi message   |           |         |

### Secure Reference API

| #   | Tiêu Chí                                   | Pass/Fail | Ghi Chú |
| --- | ------------------------------------------ | --------- | ------- |
| 8.1 | Endpoint: `GET /internal/sync/{type}/{id}` |           |         |
| 8.2 | Yêu cầu mTLS (client cert)                 |           |         |
| 8.3 | Header `X-Tenant-ID` bắt buộc              |           |         |
| 8.4 | Header `X-Consumer-ID` có mặt              |           |         |
| 8.5 | Set DB context trước query                 |           |         |
| 8.6 | RLS tự động filter kết quả                 |           |         |
| 8.7 | Response qua HTTPS (encrypted)             |           |         |

### Error Handling & Retry

| #   | Tiêu Chí                               | Pass/Fail | Ghi Chú |
| --- | -------------------------------------- | --------- | ------- |
| 9.1 | Retry với Exponential Backoff cho 5xx  |           |         |
| 9.2 | Retry 3 lần cho 404 trước khi drop/DLQ |           |         |
| 9.3 | Alert ngay lập tức cho 401/403         |           |         |
| 9.4 | DLQ cho messages không thể xử lý       |           |         |
| 9.5 | Reconciliation job định kỳ             |           |         |

---

## 3. mTLS Configuration

| #    | Tiêu Chí                                   | Pass/Fail | Ghi Chú |
| ---- | ------------------------------------------ | --------- | ------- |
| 10.1 | CA certificate shared giữa các services    |           |         |
| 10.2 | Server cert có CN đúng                     |           |         |
| 10.3 | Client cert có CN đúng                     |           |         |
| 10.4 | `requestCert: true` trên mTLS server       |           |         |
| 10.5 | `rejectUnauthorized: true` cả 2 phía       |           |         |
| 10.6 | Certificates không expired                 |           |         |
| 10.7 | Private keys được bảo vệ (permissions 600) |           |         |

---

## Summary

| Section                 | Total  | Passed | Failed | N/A |
| ----------------------- | ------ | ------ | ------ | --- |
| Checkpoint 1 (Client)   | 3      |        |        |     |
| Checkpoint 2 (Inbound)  | 7      |        |        |     |
| Checkpoint 3 (S2S)      | 5      |        |        |     |
| Checkpoint 4 (Queue)    | 5      |        |        |     |
| Checkpoint 5 (Database) | 6      |        |        |     |
| Outbox Pattern          | 6      |        |        |     |
| Reference-Based Sync    | 4      |        |        |     |
| Secure Reference API    | 7      |        |        |     |
| Error Handling          | 5      |        |        |     |
| mTLS Configuration      | 7      |        |        |     |
| **TOTAL**               | **55** |        |        |     |

---

**Auditor:** ********\_********  
**Date:** ********\_********  
**Signature:** ********\_********
