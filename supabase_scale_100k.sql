-- ============================================================================
-- PAPYRUS LODGE & RESTAURANT - 100,000+ USER SCALE DATABASE OPTIMIZATIONS
-- Target: Supabase / PostgreSQL 15+ (with Supavisor / PgBouncer pooler)
-- Description: High-concurrency composite, partial, and GIN indexes plus
--              fast RPC & connection hygiene for 100k+ concurrent/total users.
-- ============================================================================

-- 1. COMPOSITE & PARTIAL INDEXES FOR HOT READ QUERIES
-- Live kitchen & order queue queries filter by status/cooking_status and sort by created_at
CREATE INDEX IF NOT EXISTS idx_menu_orders_active_queue
    ON menu_orders (cooking_status, created_at ASC)
    WHERE cooking_status IN ('Pending', 'Preparing');

CREATE INDEX IF NOT EXISTS idx_menu_orders_status_created
    ON menu_orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_menu_orders_location_created
    ON menu_orders (location, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_menu_orders_items_gin
    ON menu_orders USING GIN (items);

-- 2. WAITER BUZZER & SERVICE CALLS HOT PATH
CREATE INDEX IF NOT EXISTS idx_waiter_calls_active_created
    ON waiter_calls (active, created_at DESC)
    WHERE active = true;

-- 3. RECEPTIONIST BOOKINGS & ROOM AVAILABILITY
CREATE INDEX IF NOT EXISTS idx_receptionist_bookings_status_room
    ON receptionist_bookings (status, room_number, check_in DESC);

-- 4. CASHIER RECEIPTS & RECONCILIATION
CREATE INDEX IF NOT EXISTS idx_cashier_tx_order_created
    ON cashier_transactions (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cashier_tx_method_status
    ON cashier_transactions (payment_method, status, created_at DESC);

-- 5. STAFF ATTENDANCE & SECURITY LOGS
CREATE INDEX IF NOT EXISTS idx_staff_attendance_role_clockin
    ON staff_attendance (role, clock_in DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_time_in
    ON security_logs (time_in DESC);

-- 6. SYSTEM SETTINGS BOOTSTRAP ACCELERATION
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at
    ON system_settings (updated_at DESC);

-- Ensure updated_at stays accurate for cache-busting & ETag checks
CREATE OR REPLACE FUNCTION trigger_set_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_system_settings ON system_settings;
CREATE TRIGGER set_timestamp_system_settings
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_system_settings_timestamp();

-- 7. LIGHTWEIGHT SERVER-SIDE STATS RPC FOR HIGH-CONCURRENCY QUEUE CHECKS
CREATE OR REPLACE FUNCTION get_live_kitchen_queue_summary()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT jsonb_build_object(
        'pending_count', COUNT(*) FILTER (WHERE cooking_status = 'Pending'),
        'preparing_count', COUNT(*) FILTER (WHERE cooking_status = 'Preparing'),
        'total_active', COUNT(*) FILTER (WHERE cooking_status IN ('Pending', 'Preparing')),
        'generated_at', timezone('utc'::text, now())
    )
    FROM menu_orders
    WHERE status NOT IN ('Cancelled', 'Refunded')
      AND created_at >= timezone('utc'::text, now()) - INTERVAL '24 hours';
$$;

-- 8. AUTOVACUUM & FILLFACTOR TUNING FOR FREQUENTLY UPDATED TABLES
ALTER TABLE system_settings SET (fillfactor = 80);
ALTER TABLE menu_orders SET (fillfactor = 85);

-- ============================================================================
-- DEPLOYMENT SCALE NOTES (100,000+ USERS):
-- 1. Use Supabase Supavisor Transaction Pooler URL (port 6543) for server-side
--    queries when running multiple worker instances or Cloud Run autoscaling.
-- 2. Run Node server in production with: NODE_ENV=production node server.ts
--    (automatically spawns multi-core cluster workers on all available CPUs).
-- 3. Override worker count via WEB_CONCURRENCY env var if needed.
-- ============================================================================
