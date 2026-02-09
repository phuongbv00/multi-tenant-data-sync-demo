-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy for users table
-- Checkpoint 5: Service-to-Database protection
DROP POLICY IF EXISTS tenant_isolation_policy ON users;
CREATE POLICY tenant_isolation_policy ON users
    FOR ALL
    USING (
        -- Admin Role: Bypass Tenant Check
        (current_setting('app.role', true) = 'admin')
        OR
        -- Standard Check: Data must match current tenant context
        (org_id = current_setting('app.current_tenant', true)::uuid)
    )
    WITH CHECK (
        (current_setting('app.role', true) = 'admin')
        OR
        (org_id = current_setting('app.current_tenant', true)::uuid)
    );

-- Force RLS for table owner as well
ALTER TABLE users FORCE ROW LEVEL SECURITY;
