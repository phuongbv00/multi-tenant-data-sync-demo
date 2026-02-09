# Secure Multi-Tenant Data Synchronization

Tài liệu thiết kế và demo implementation cho hệ thống đồng bộ dữ liệu an toàn giữa các microservices trong môi trường multi-tenant.

---

## 📋 Tổng Quan

Dự án này giải quyết 2 bài toán cốt lõi trong kiến trúc microservices:

1. **Tenant Isolation** - Ngăn chặn truy cập chéo dữ liệu giữa các tenants
2. **Secure Data Sync** - Đồng bộ dữ liệu an toàn mà không để lộ PII qua Message Queue

## 📁 Cấu Trúc Tài Liệu

```
.
├── README.md                    # File này
├── 1_LLD_TENANT_ISOLATION.md    # LLD: Checkpoint Defense Architecture
├── 2_LLD_DATA_SYNC.md           # LLD: Secure Data Sync
├── 3_LLD_AUDIT_CHECKLIST.md     # Audit checklist cho cả 2 LLD
└── demo/                        # Demo implementation đầy đủ
```

## 🔑 Key Takeaways

1. **Không tin tưởng 1 layer duy nhất** - Luôn có fallback
2. **PII không đi qua Message Queue** - Reference-based sync
3. **mTLS là bắt buộc cho S2S** - Không chỉ HTTPS
4. **RLS là lớp cuối cùng** - Dù code có bug, DB vẫn chặn
5. **Audit thường xuyên** - Sử dụng checklist
