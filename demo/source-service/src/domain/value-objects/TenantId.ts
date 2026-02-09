// Value Object: Tenant ID
// Immutable identifier for tenant context

export class TenantId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): TenantId {
    if (!value || !this.isValidUUID(value)) {
      throw new Error(`Invalid tenant ID: ${value}`);
    }
    return new TenantId(value);
  }

  static defaultTenant(): TenantId {
    return new TenantId("00000000-0000-0000-0000-000000000000");
  }

  private static isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }

  isDefault(): boolean {
    return this.value === "00000000-0000-0000-0000-000000000000";
  }

  toString(): string {
    return this.value;
  }
}
