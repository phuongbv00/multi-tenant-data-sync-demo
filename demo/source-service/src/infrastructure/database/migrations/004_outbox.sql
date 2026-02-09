-- Outbox table for Transactional Outbox Pattern
CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(255) NOT NULL,  -- e.g., 'USER'
    aggregate_id VARCHAR(255) NOT NULL,    -- e.g., 'u-123'
    event_type VARCHAR(255) NOT NULL,      -- e.g., 'CREATED', 'UPDATED'
    payload JSONB NOT NULL,                -- Metadata only (no PII!)
    status VARCHAR(50) DEFAULT 'PENDING',  -- 'PENDING', 'PUBLISHED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Partial index for pending events (optimized polling)
CREATE INDEX IF NOT EXISTS idx_outbox_pending 
    ON outbox(created_at) 
    WHERE status = 'PENDING';

-- Trigger function for automatic outbox insertion (optional)
CREATE OR REPLACE FUNCTION notify_user_changes() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO outbox (aggregate_type, aggregate_id, event_type, payload)
    VALUES (
        'USER',
        NEW.id::text,
        TG_OP,
        jsonb_build_object(
            'org_id', NEW.org_id,
            'timestamp', NOW()
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS user_outbox_trigger ON users;
CREATE TRIGGER user_outbox_trigger
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION notify_user_changes();
