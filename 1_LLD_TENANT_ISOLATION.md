# Low-Level Design (LLD): Tenant Isolation Strategy

## 1. Cơ Sở Lý Thuyết & Mục Tiêu

Tài liệu này định nghĩa nền tảng kỹ thuật cho việc kiểm soát multi-tenancy, là tiền đề bắt buộc cho mọi service trong hệ thống.

**Mục tiêu cốt lõi:** Ngăn chặn truy cập chéo (Cross-tenant Access) tại mọi checkpoint.

## 2. Checkpoint Defense Architecture

Hệ thống áp dụng cơ chế bảo vệ tại 5 checkpoints cụ thể để đảm bảo tính toàn vẹn của dữ liệu tenant.

```mermaid
graph LR
    subgraph "Checkpoint 1"
        Client[Client App]
    end

    subgraph ServiceA["Service A"]
        subgraph "Checkpoint 2"
            MW[Middleware/Filter]
        end
        Logic[Business Logic]
    end

    subgraph "Checkpoint 3"
        S2S[Service B<br/>mTLS]
    end

    subgraph "Checkpoint 4"
        Queue[(Message Queue)]
    end

    subgraph "Checkpoint 5"
        DB[(Database<br/>RLS)]
    end

    Client -->|"Token (contains org_id)"| MW
    MW -->|"Set X-Tenant-ID"| Logic
    Logic -->|mTLS| S2S
    Logic -->|Publish| Queue
    Queue -->|Consume| Consumer[Consumer]
    Logic -->|Query| DB
    S2S -->|Query| DB
    Consumer -->|Query| DB

    style Client fill:#e1f5fe
    style MW fill:#fff3e0
    style S2S fill:#e8f5e9
    style Queue fill:#fce4ec
    style DB fill:#f3e5f5
```

### 2.1 Checkpoint 1: Client App (Defensive Check)

- **Vai trò:** Phòng vệ bổ sung (Defensive Programming), không phải là điểm đảm bảo an ninh chính.
- **Cơ chế:**
  - Client App phải luôn kiểm tra sự tồn tại và hợp lệ của `org_id` trước khi thực hiện bất kỳ request nào.
  - Nếu phát hiện thiếu hoặc sai `org_id`:
    1.  Không hiển thị dữ liệu liên quan.
    2.  Không xử lý tiếp (cache/logic).
    3.  Chặn request gửi đi để giảm tải rác cho server.

```mermaid
sequenceDiagram
    participant U as User Action
    participant C as Client App
    participant S as Server

    U->>C: Trigger Action
    activate C
    C->>C: Check: org_id exists?
    alt org_id Missing/Invalid
        C->>C: Block request
        C-->>U: Show Error / Hide Data
    else org_id Valid
        C->>S: Request + Token (org_id in claims)
        S-->>C: Response
        C-->>U: Display Data
    end
    deactivate C
```

### 2.2 Checkpoint 2: Service Inbound (Middleware/Filter)

- **Vị trí:** Service Middleware.
- **Cơ chế:**
  1.  **Token Requirement:** Mọi API của service đều yêu cầu có Token.
  2.  **S2S Fallback:** Nếu request không có Token người dùng (User Token) mà là giao tiếp nội bộ, chuyển tiếp cho xử lý tại **Checkpoint 3 (S2S)**.
  3.  **Validation Flow:**
      - Xác thực Token (Signature verification) để chống MITM.
      - Trích xuất Claims từ Token -> Trích xuất `org_id` và set vào header `X-Tenant-ID`.
      - **Validate Tenant:**
        - Org có đang active không?
        - User có thuộc Org này không?
  4.  **Kết quả:**
      - Thành công: Cho phép đi tiếp.
      - Thất bại: Trả về `401 Unauthorized` ngay lập tức.

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant L as Business Logic
    participant DB as Database

    C->>M: Request + Token
    activate M
    M->>M: Verify Token Signature
    M->>M: Extract org_id from Claims
    M->>DB: Query: Is org_id active?
    DB-->>M: Org Status
    alt Org Inactive or User not in Org
        M-->>C: 401 Unauthorized
    else Valid
        M->>M: Set X-Tenant-ID = org_id
        M->>L: Forward Request
        deactivate M
        activate L
        L-->>C: Response
        deactivate L
    end
```

### 2.3 Checkpoint 3: Service-to-Service (S2S)

- **Vị trí:** Giao tiếp giữa các microservices.
- **Cơ chế:**
  1.  **mTLS:** Bảo vệ kênh truyền, chống MITM.
  2.  **Header Extraction:** Trích xuất `org_id` từ header `X-Tenant-ID`.
  3.  **Validation:** Thực hiện validate `org_id` tương tự như quy trình tại **Checkpoint 2**.

```mermaid
sequenceDiagram
    participant A as Service A
    participant B as Service B (mTLS)
    participant DB as Database

    A->>B: mTLS Request + X-Tenant-ID header
    activate B
    B->>B: Verify Client Certificate
    alt Cert Invalid
        B-->>A: 401 Unauthorized (TLS Handshake Fail)
    else Cert Valid
        B->>B: Extract org_id from X-Tenant-ID
        B->>DB: Validate org_id exists & active
        alt org_id Invalid
            B-->>A: 401 Unauthorized
        else Valid
            B->>B: SET app.current_tenant = org_id
            B->>DB: Query (RLS filtered)
            DB-->>B: Results
            B-->>A: Response
        end
    end
    deactivate B
```

### 2.4 Checkpoint 4: Service-to-Queue (Async Messaging)

- **Vị trí:** Message Broker (Producer & Consumer).
- **Cơ chế:**
  1.  **Producer Side:** Kiểm soát message trước khi gửi. Message bắt buộc phải chứa `org_id` hợp lệ. Nếu không -> Chặn publish.
  2.  **Consumer Side:** Thiết lập chốt chặn thứ 2.
      - Khi nhận message, consumer kiểm tra lại tính hợp lệ của `org_id`.
      - Nếu message không có `org_id` hợp lệ (trường hợp producer bị bypass), consumer **từ chối xử lý**.

```mermaid
sequenceDiagram
    participant P as Producer
    participant Q as Message Queue
    participant C as Consumer
    participant DLQ as Dead Letter Queue

    rect rgb(230, 245, 255)
        Note over P,Q: Producer Side Validation
        P->>P: Check: message has org_id?
        alt org_id Missing
            P->>P: Block publish
        else org_id Present
            P->>Q: Publish {entity_id, org_id, action}
        end
    end

    rect rgb(255, 243, 224)
        Note over Q,DLQ: Consumer Side Validation
        Q->>C: Consume Message
        activate C
        C->>C: Validate org_id exists & valid
        alt org_id Invalid
            C->>DLQ: Send to DLQ
            C->>C: Reject processing
        else org_id Valid
            C->>C: Process message
            C->>C: SET tenant context = org_id
        end
        deactivate C
    end
```

### 2.5 Checkpoint 5: Service-to-Database (Data Access)

- **Vị trí:** Repository / Data Access Layer.
- **Cơ chế:** Chốt chặn cuối cùng bảo vệ dữ liệu.
  1.  **Global Repository Filter:** Luôn đưa điều kiện `org_id` match vào mọi câu query tại tầng ứng dụng (ORM scopes/filters).
  2.  **Row Level Security (RLS):** Cơ chế bảo vệ cứng tại Database (PostgreSQL Policy).

```mermaid
sequenceDiagram
    participant S as Service
    participant DB as PostgreSQL

    S->>DB: BEGIN Transaction
    S->>DB: SET LOCAL app.current_tenant = 'org-123'
    S->>DB: SELECT * FROM users
    activate DB
    Note right of DB: RLS Policy Auto-Applied
    DB->>DB: WHERE org_id = current_setting('app.current_tenant')
    DB-->>S: Filtered Results (only org-123 data)
    deactivate DB
    S->>DB: INSERT INTO users (name, org_id) VALUES ('John', 'org-456')
    activate DB
    Note right of DB: RLS WITH CHECK
    alt org_id mismatch context
        DB-->>S: ERROR: Policy violation
    else org_id matches
        DB-->>S: INSERT OK
    end
    deactivate DB
    S->>DB: COMMIT
```

## Appendix

### A. Đặc Tả Dữ Liệu Tenant & Migration Strategy

Hiện tại, hệ thống vận hành với **1 Default Tenant (Reserved Tenant)**, nhưng kiến trúc cần sẵn sàng cho Multi-Tenancy.
Khi thực hiện migration, toàn bộ dữ liệu hiện hữu phải được gắn với Default Tenant này.

### A.1 Global Schema Requirement

```sql
-- Thêm cột org_id, đặt giá trị mặc định là Default Tenant ID cho dữ liệu cũ
ALTER TABLE [table_name]
ADD COLUMN org_id UUID NOT NULL
DEFAULT '00000000-0000-0000-0000-000000000000' -- Reserved Tenant UUID
REFERENCES organizations(id);

CREATE INDEX idx_[table_name]_org_id ON [table_name](org_id);
```

### B. RLS Implementation (PostgreSQL)

### B.1 Policy Definition

Mẫu Policy áp dụng cho các bảng cần bảo vệ:

```sql
-- 1. Kích hoạt RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- 2. Tạo Policy
CREATE POLICY [policy_name] ON [table_name]
    FOR ALL
    USING (
        -- Admin Role: Bypass Tenant Check (Middleware set context 'app.role', sau khi verify user)
        (current_setting('app.role', true) = 'admin')
        OR
        -- Standard Check: Dữ liệu phải khớp với Tenant Context hiện tại
        (org_id = current_setting('app.current_tenant')::uuid)
    )
    WITH CHECK (
        (current_setting('app.role', true) = 'admin')
        OR
        (org_id = current_setting('app.current_tenant')::uuid)
    );
```

### B.2 Sử dụng trong Transaction (Node.js / pg-pool)

```javascript
const client = await pool.connect();
try {
  await client.query("BEGIN");

  // Quan trọng: Set context ngay đầu transaction
  await client.query(`SET LOCAL app.current_tenant = $1`, ["org-123"]);

  // Các query sau đó sẽ tự động bị filter bởi Policy đã định nghĩa
  const res = await client.query("SELECT * FROM users");

  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}
```
