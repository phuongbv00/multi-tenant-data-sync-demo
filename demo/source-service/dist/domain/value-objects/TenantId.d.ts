export declare class TenantId {
    private readonly value;
    private constructor();
    static create(value: string): TenantId;
    static defaultTenant(): TenantId;
    private static isValidUUID;
    getValue(): string;
    equals(other: TenantId): boolean;
    isDefault(): boolean;
    toString(): string;
}
//# sourceMappingURL=TenantId.d.ts.map