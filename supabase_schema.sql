-- ==========================================
-- PAPYRUS LODGE & RESTAURANT DATABASE SCHEMA
-- Target Database: Supabase / PostgreSQL
-- Description: Core schema to store menu orders, waiter calls, chef states,
--              receptionist bookings, security logs, cashier transactions,
--              manager approvals, and admin controls.
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MENU ORDERS (Stores customer selections, table/room, cooking status & waiter details)
CREATE TABLE IF NOT EXISTS menu_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,                       -- Simple incrementing order number for human display
    location VARCHAR(50) NOT NULL,             -- Table number, Room number, or VIP Lounge
    items JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of ordered items: [{"id": "...", "name": "...", "price": 100, "qty": 2, "customInstructions": "..."}]
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,-- Total price before charges
    status VARCHAR(20) NOT NULL DEFAULT 'Unpaid', -- Unpaid, Paid, Cancelled, Refunded
    cooking_status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Preparing, Completed
    served_by_waiter BOOLEAN NOT NULL DEFAULT false, -- True when waiter serves the food to client
    waiter_name VARCHAR(100),                  -- Name of assigned waiter/staff member
    notes TEXT,                                -- Overall order instructions/notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. WAITER CALLS / BUZZERS (Stores active waiter call requests from tables/rooms)
CREATE TABLE IF NOT EXISTS waiter_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(50) NOT NULL,             -- Table or Room triggering the buzzer
    call_type VARCHAR(30) NOT NULL DEFAULT 'waiter', -- waiter (አስተናጋጅ), help, checkout, pickup
    message VARCHAR(255),                      -- "አስተናጋጅ ይፈልጋል", "ትዕዛዝ ደርሷል", etc.
    active BOOLEAN NOT NULL DEFAULT true,      -- Is active/unresolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RECEPTIONIST ROOM BOOKINGS (Stores hotel room occupancies, guest info, check-in states)
CREATE TABLE IF NOT EXISTS receptionist_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(20) NOT NULL,
    guest_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    guests_count INTEGER NOT NULL DEFAULT 1,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'Checked-In', -- Booked, Checked-In, Checked-Out, Cancelled
    receptionist_name VARCHAR(100),            -- Receptionist who checked them in
    price_per_night NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SECURITY LOGS (Stores gate records, vehicle checks, and security guard records)
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_name VARCHAR(150),
    plate_number VARCHAR(50),                 -- Vehicle license plate (e.g., Code 2 - AA 12345)
    phone_number VARCHAR(30),
    purpose_of_visit VARCHAR(255),
    time_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    time_out TIMESTAMP WITH TIME ZONE,
    guard_name VARCHAR(100),                   -- Security officer on duty
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CASHIER TRANSACTIONS (Stores cash/digital receipt verifications, CBE/Telebirr logs)
CREATE TABLE IF NOT EXISTS cashier_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES menu_orders(id) ON DELETE SET NULL, -- Connects to menu_orders
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,       -- cash, telebirr, cbe_transfer, chapa_card, chapa_telebirr
    service_charge NUMERIC(10, 2) DEFAULT 0.00,
    vat NUMERIC(10, 2) DEFAULT 0.00,
    reference_number VARCHAR(100),             -- Transaction transaction ID / Bank receipt reference
    cashier_name VARCHAR(100),                 -- Name of Cashier on duty
    status VARCHAR(20) NOT NULL DEFAULT 'Verified', -- Pending, Verified, Rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. STAFF ATTENDANCE (Stores daily clock-in/out records for all system roles)
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,                 -- Waiter, Chef, Receptionist, Security, Cashier, Manager
    clock_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    wifi_ssid VARCHAR(100),                    -- Verifies they clocked in while connected to lodge wifi
    status VARCHAR(20) NOT NULL DEFAULT 'Approved', -- Approved, Pending Approval, Rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. MANAGER BONUSES (Tracks staff financial incentives and tips given by management)
CREATE TABLE IF NOT EXISTS manager_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_name VARCHAR(150) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,                      -- E.g., "ለላቀ የደንበኛ አያያዝ እና አገልግሎት"
    awarded_by VARCHAR(100) NOT NULL,          -- Manager name who approved the bonus
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. SYSTEM SETTINGS & ADMIN CONTROLS (Stores custom lodge metadata, tax rates, live controls)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- INDEXES FOR FAST RETRIEVAL & QUERYING
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_menu_orders_status ON menu_orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_orders_cooking ON menu_orders(cooking_status);
CREATE INDEX IF NOT EXISTS idx_waiter_calls_active ON waiter_calls(active);
CREATE INDEX IF NOT EXISTS idx_receptionist_bookings_status ON receptionist_bookings(status);
CREATE INDEX IF NOT EXISTS idx_security_logs_plate ON security_logs(plate_number);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_name ON staff_attendance(staff_name);


-- ==========================================
-- REAL-TIME SUBSCRIPTION REPLICATION (Supabase)
-- Enforce Supabase's Real-Time notifications on these critical tables
-- ==========================================
alter publication supabase_realtime add table menu_orders;
alter publication supabase_realtime add table waiter_calls;
alter publication supabase_realtime add table receptionist_bookings;
alter publication supabase_realtime add table security_logs;
alter publication supabase_realtime add table cashier_transactions;
alter publication supabase_realtime add table staff_attendance;
alter publication supabase_realtime add table manager_bonuses;


-- ==========================================
-- AUTOMATIC TIMESTAMPS HANDLERS
-- ==========================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_menu_orders
BEFORE UPDATE ON menu_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
