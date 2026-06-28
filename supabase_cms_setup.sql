-- ========================================================
-- PAPYRUS LODGE - SUPER ADMIN CMS DATABASE SCHEMA & SETUP
-- ========================================================
-- Target Database: Supabase (PostgreSQL)
-- Description: Creates necessary tables, configures Row Level Security (RLS)
--              and sets up storage buckets for dynamic content management.
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create storage bucket for lodge-media
-- Note: In Supabase, this inserts a record in the storage.buckets table
INSERT INTO storage.buckets (id, name, public)
VALUES ('lodge-media', 'lodge-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'lodge-media');

CREATE POLICY "Admin Insert Access" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'lodge-media' AND auth.role() = 'authenticated');

CREATE POLICY "Admin Update Access" ON storage.objects
    FOR UPDATE USING (bucket_id = 'lodge-media' AND auth.role() = 'authenticated');

CREATE POLICY "Admin Delete Access" ON storage.objects
    FOR DELETE USING (bucket_id = 'lodge-media' AND auth.role() = 'authenticated');


-- 2. Create admin_users table (stores custom roles & statuses of administrators)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'Admin', -- Admin, SuperAdmin
    status VARCHAR(20) DEFAULT 'Active', -- Active, Disabled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if an email belongs to an Admin (for login checking)
CREATE POLICY "Allow public read for admins" ON admin_users
    FOR SELECT USING (true);

-- Allow authenticated Admins/SuperAdmins write access to admin roster
CREATE POLICY "Allow authenticated admin write roster" ON admin_users
    FOR ALL USING (auth.role() = 'authenticated');


-- 3. Create hero_section table
CREATE TABLE IF NOT EXISTS hero_section (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    title_am TEXT NOT NULL,
    title_en TEXT NOT NULL,
    subtitle_am TEXT NOT NULL,
    subtitle_en TEXT NOT NULL,
    bg_video_url TEXT,
    bg_image_url TEXT,
    cta_text_am VARCHAR(100),
    cta_text_en VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for hero_section
ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of hero" ON hero_section FOR SELECT USING (true);
CREATE POLICY "Allow admin write of hero" ON hero_section FOR ALL USING (auth.role() = 'authenticated');


-- 4. Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    review_am TEXT NOT NULL,
    review_en TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'Approved', -- Approved, Pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Allow admin write of testimonials" ON testimonials FOR ALL USING (auth.role() = 'authenticated');


-- 5. Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_am VARCHAR(255),
    title_en VARCHAR(255),
    image_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General', -- Lodge, Food, Lake, Rooms, Venue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for gallery
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Allow admin write of gallery" ON gallery FOR ALL USING (auth.role() = 'authenticated');


-- 6. Create contact_info table
CREATE TABLE IF NOT EXISTS contact_info (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address_am TEXT NOT NULL,
    address_en TEXT NOT NULL,
    telegram TEXT,
    facebook TEXT,
    instagram TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for contact_info
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of contact" ON contact_info FOR SELECT USING (true);
CREATE POLICY "Allow admin write of contact" ON contact_info FOR ALL USING (auth.role() = 'authenticated');


-- 7. Create menu_items_cms table (unifies restaurant foods, drinks, rooms, and venue services)
CREATE TABLE IF NOT EXISTS menu_items_cms (
    id VARCHAR(100) PRIMARY KEY,
    cat VARCHAR(50) NOT NULL, -- food, drinks, room, venue, traditional
    name_am VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description_am TEXT,
    description_en TEXT,
    image TEXT NOT NULL,
    available BOOLEAN DEFAULT true,
    customizable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for menu_items_cms
ALTER TABLE menu_items_cms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of menu items" ON menu_items_cms FOR SELECT USING (true);
CREATE POLICY "Allow admin write of menu items" ON menu_items_cms FOR ALL USING (auth.role() = 'authenticated');


-- ========================================================
-- PRE-SEED DATA FOR SYSTEM CONTENT
-- ========================================================

-- Seed permanent Super Admin account reference
INSERT INTO admin_users (email, name, role, status)
VALUES ('tamecolorgrading@gmail.com', 'Super Admin', 'SuperAdmin', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Seed default Hero Settings
INSERT INTO hero_section (id, title_am, title_en, subtitle_am, subtitle_en, bg_video_url, bg_image_url, cta_text_am, cta_text_en)
VALUES (
    'main',
    'ውብና ሰላማዊው የሀዋሳ ማረፊያዎ',
    'Your Sanctuary of Peace in Hawassa',
    'በታዋቂው የሀዋሳ ሀይቅ ዳርቻ ላይ የተንጣለለ፣ ልዩ መስተንግዶ እና ባህላዊ ምግቦች የሚቀርቡበት ተመራጭ ሎጅ።',
    'Nestled elegantly along the shore of Lake Hawassa, offering luxury suites, traditional organic culinary delights, and breathtaking lake vistas.',
    'https://www.youtube.com/watch?v=AHuU7i--EUc',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&auto=format&fit=crop',
    'ክፍል ይያዙ (BOOK A ROOM)',
    'BOOK A ROOM'
) ON CONFLICT (id) DO NOTHING;

-- Seed default Contact Info
INSERT INTO contact_info (id, phone, email, address_am, address_en, telegram, facebook, instagram)
VALUES (
    'main',
    '+251 919 629 347',
    'info@papyruslodgehawassa.com',
    'ሀዋሳ፣ ባህር ዳር መንገድ፣ ኢትዮጵያ',
    'Lakefront Blvd, Hawassa, Ethiopia',
    'https://t.me/papyruslodge',
    'https://facebook.com/papyruslodgehawassa',
    'https://instagram.com/papyruslodge'
) ON CONFLICT (id) DO NOTHING;

-- Seed default Testimonials
INSERT INTO testimonials (guest_name, avatar_url, review_am, review_en, rating, status)
VALUES 
('Yonas K.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', 'ለቤተሰብ እረፍት በጣም የሚመች ሰላማዊ ቦታ ነው። ምግቡም በጣም ጣፋጭ ነው።', 'A truly peaceful sanctuary for family retreats. The traditional cuisine is exceptional!', 5, 'Approved'),
('Sophia B.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', 'የሀይቁ እይታ እና የሰራተኞቹ መስተንግዶ ከሚጠበቀው በላይ ነበር።', 'The lakeside view is stunning and the hospitality was incredibly warm and professional.', 5, 'Approved')
ON CONFLICT DO NOTHING;

-- Seed default Gallery
INSERT INTO gallery (title_am, title_en, image_url, category)
VALUES 
('የሎጅ ውጫዊ ገጽታ', 'Lodge Exterior View', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'Lodge'),
('የሀዋሳ ዓሳ ጥብስ', 'Fried Hawassa Fish', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800', 'Food'),
('ዴሉክስ ሱዊት አልጋ', 'Deluxe Suite Bed', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'Rooms')
ON CONFLICT DO NOTHING;
