-- Organizations table (Tenant management)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tenant (Reserved Tenant)
INSERT INTO organizations (id, name, status) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'Default Tenant', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
