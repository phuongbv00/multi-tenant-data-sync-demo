// Integration Test: Full Sync Flow
// This test requires Docker to be running with PostgreSQL and Kafka

import { Pool } from "pg";

describe("Full Sync Flow Integration", () => {
  let pool: Pool;
  const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000000";

  beforeAll(async () => {
    // Skip if not in integration test environment
    if (!process.env.RUN_INTEGRATION_TESTS) {
      console.log(
        "Skipping integration tests (set RUN_INTEGRATION_TESTS=1 to run)",
      );
      return;
    }

    pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "app_user", // Use app_user (non-superuser) for RLS enforcement
      password: process.env.DB_PASSWORD || "app123",
      database: process.env.DB_NAME || "source_db",
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("should create user and generate outbox event", async () => {
    if (!process.env.RUN_INTEGRATION_TESTS) {
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Set tenant context (SET doesn't support parameterized queries)
      await client.query(`SET LOCAL app.current_tenant = '${TEST_TENANT_ID}'`);

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (org_id, email, name) 
         VALUES ($1, $2, $3) RETURNING id`,
        [
          TEST_TENANT_ID,
          `test-${Date.now()}@example.com`,
          "Integration Test User",
        ],
      );
      const userId = userResult.rows[0].id;

      // Verify outbox event was created (via trigger)
      const outboxResult = await client.query(
        `SELECT * FROM outbox WHERE aggregate_id = $1 AND status = 'PENDING'`,
        [userId],
      );

      expect(outboxResult.rows.length).toBe(1);
      expect(outboxResult.rows[0].aggregate_type).toBe("USER");
      expect(outboxResult.rows[0].event_type).toBe("INSERT");

      await client.query("ROLLBACK"); // Clean up
    } finally {
      client.release();
    }
  });

  it("should enforce RLS - block cross-tenant access", async () => {
    if (!process.env.RUN_INTEGRATION_TESTS) {
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create a user with default tenant
      await client.query(`SET LOCAL app.current_tenant = '${TEST_TENANT_ID}'`);
      const result = await client.query(
        `INSERT INTO users (org_id, email, name) 
         VALUES ($1, $2, $3) RETURNING id`,
        [TEST_TENANT_ID, `rls-test-${Date.now()}@example.com`, "RLS Test User"],
      );
      const userId = result.rows[0].id;
      await client.query("COMMIT");

      // Now try to access with a different tenant
      await client.query("BEGIN");
      await client.query(
        `SET LOCAL app.current_tenant = '11111111-1111-1111-1111-111111111111'`,
      );

      const accessResult = await client.query(
        "SELECT * FROM users WHERE id = $1",
        [userId],
      );

      // RLS should block access - should return empty
      expect(accessResult.rows.length).toBe(0);

      await client.query("ROLLBACK");

      // Cleanup: delete the test user with correct tenant
      await client.query("BEGIN");
      await client.query(`SET LOCAL app.current_tenant = '${TEST_TENANT_ID}'`);
      await client.query("DELETE FROM users WHERE id = $1", [userId]);
      await client.query("COMMIT");
    } finally {
      client.release();
    }
  });

  it("should process outbox with SKIP LOCKED", async () => {
    if (!process.env.RUN_INTEGRATION_TESTS) {
      return;
    }

    const client1 = await pool.connect();
    const client2 = await pool.connect();

    try {
      // Client 1 locks some rows
      await client1.query("BEGIN");
      const locked = await client1.query(
        `SELECT * FROM outbox WHERE status = 'PENDING' LIMIT 5 FOR UPDATE`,
      );

      // Client 2 should skip locked rows
      await client2.query("BEGIN");
      const skipped = await client2.query(
        `SELECT * FROM outbox WHERE status = 'PENDING' LIMIT 5 FOR UPDATE SKIP LOCKED`,
      );

      // If client 1 locked all pending rows, client 2 should get different or no rows
      const lockedIds = locked.rows.map((r: any) => r.id);
      const skippedIds = skipped.rows.map((r: any) => r.id);

      // No overlap between locked and skipped
      const overlap = lockedIds.filter((id: string) => skippedIds.includes(id));
      expect(overlap.length).toBe(0);

      await client1.query("ROLLBACK");
      await client2.query("ROLLBACK");
    } finally {
      client1.release();
      client2.release();
    }
  });
});
