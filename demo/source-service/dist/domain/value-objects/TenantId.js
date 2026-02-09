"use strict";
// Value Object: Tenant ID
// Immutable identifier for tenant context
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantId = void 0;
class TenantId {
    value;
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!value || !this.isValidUUID(value)) {
            throw new Error(`Invalid tenant ID: ${value}`);
        }
        return new TenantId(value);
    }
    static defaultTenant() {
        return new TenantId("00000000-0000-0000-0000-000000000000");
    }
    static isValidUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
    getValue() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    isDefault() {
        return this.value === "00000000-0000-0000-0000-000000000000";
    }
    toString() {
        return this.value;
    }
}
exports.TenantId = TenantId;
//# sourceMappingURL=TenantId.js.map