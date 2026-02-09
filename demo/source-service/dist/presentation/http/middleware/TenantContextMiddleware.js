"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTenantContextMiddleware = createTenantContextMiddleware;
const TenantId_1 = require("../../../domain/value-objects/TenantId");
function createTenantContextMiddleware(pool) {
    return async (req, res, next) => {
        try {
            // 1. Extract tenant ID from header (set by gateway after JWT validation)
            const tenantIdHeader = req.headers["x-tenant-id"];
            if (!tenantIdHeader) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Missing X-Tenant-ID header",
                });
            }
            // 2. Validate and create TenantId value object
            let tenantId;
            try {
                tenantId = TenantId_1.TenantId.create(tenantIdHeader);
            }
            catch (error) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Invalid tenant ID format",
                });
            }
            // 3. Validate tenant exists and is active
            const client = await pool.connect();
            try {
                const result = await client.query("SELECT status FROM organizations WHERE id = $1", [tenantId.getValue()]);
                if (result.rows.length === 0) {
                    return res.status(401).json({
                        error: "Unauthorized",
                        message: "Tenant not found",
                    });
                }
                if (result.rows[0].status !== "ACTIVE") {
                    return res.status(401).json({
                        error: "Unauthorized",
                        message: "Tenant is not active",
                    });
                }
            }
            finally {
                client.release();
            }
            // 4. Extract role from header (optional, for admin bypass)
            const role = req.headers["x-user-role"];
            // 5. Set tenant context on request
            req.tenantContext = {
                tenantId,
                role,
            };
            next();
        }
        catch (error) {
            console.error("Tenant context middleware error:", error);
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to validate tenant context",
            });
        }
    };
}
//# sourceMappingURL=TenantContextMiddleware.js.map