export interface User {
    id: string;
    orgId: string;
    email: string;
    name: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserInput {
    orgId: string;
    email: string;
    name: string;
    phone?: string;
}
export interface UpdateUserInput {
    name?: string;
    phone?: string;
}
//# sourceMappingURL=User.d.ts.map