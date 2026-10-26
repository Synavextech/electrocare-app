-- ==============================================================================
-- ELECTROCARE COMPREHENSIVE DATABASE SCHEMA (STANDALONE & FULLY IDEMPOTENT)
-- Optimized for Supabase (PostgreSQL)
--
-- This script safely handles both initial installation and incremental migrations.
-- Resolves PostgreSQL Error 42710 (duplicate types/policies) and 42501 (RLS permissions).
-- Synchronized 100% with Database_update.sql and all server/client models.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. IDEMPOTENT ENUM TYPES (Resolves ERROR 42710: type "user_role" already exists)
-- ==============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'technician', 'shop', 'delivery');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repair_status') THEN
        CREATE TYPE repair_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'accepted', 'in_transit');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'waived', 'completed');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
        CREATE TYPE sale_status AS ENUM ('pending', 'approved', 'rejected', 'sold');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'condition_type') THEN
        CREATE TYPE condition_type AS ENUM ('New', 'Used', 'Refurbished', 'Unusable');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
        CREATE TYPE purchase_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
    END IF;
END $$;

-- Ensure newly added enum values exist on previously created databases
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'delivery';
ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'waived';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'completed';

-- ==============================================================================
-- 3. CORE TABLES (CREATE TABLE IF NOT EXISTS)
-- ==============================================================================

-- 3.1 Users Profile Table (synced with auth.users)
CREATE TABLE IF NOT EXISTS "User" (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'user',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 Shops Table
CREATE TABLE IF NOT EXISTS "Shops" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "shopCode" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    county TEXT,
    rating DOUBLE PRECISION DEFAULT 4.5,
    services TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active',
    "statusNote" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 Technicians Table
CREATE TABLE IF NOT EXISTS "Technicians" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    rating DOUBLE PRECISION DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    category TEXT,
    "subCategory" TEXT,
    "shopId" UUID REFERENCES "Shops"(id) ON DELETE SET NULL,
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    "statusNote" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 Delivery Personnel Table
CREATE TABLE IF NOT EXISTS "DeliveryPersonnel" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('RealTime', 'OneTime')),
    region TEXT,
    phone TEXT,
    rating DOUBLE PRECISION DEFAULT 4.5,
    current_load INTEGER DEFAULT 0,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    "shopId" UUID REFERENCES "Shops"(id) ON DELETE SET NULL,
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    email TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    "statusNote" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.5 Repair Requests Table
CREATE TABLE IF NOT EXISTS "RepairRequest" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "request_id" TEXT UNIQUE NOT NULL,
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    "technicianId" UUID REFERENCES "Technicians"(id) ON DELETE SET NULL,
    "shopId" UUID REFERENCES "Shops"(id) ON DELETE SET NULL,
    "deliveryPersonnelId" UUID REFERENCES "DeliveryPersonnel"(id) ON DELETE SET NULL,
    "device_type" TEXT NOT NULL,
    "device_model" TEXT,
    issue TEXT NOT NULL,
    status repair_status DEFAULT 'pending',
    delivery BOOLEAN DEFAULT FALSE,
    "trackingNumber" TEXT,
    cost NUMERIC(10,2),
    "paymentMethod" TEXT DEFAULT 'cod',
    discount INTEGER DEFAULT 0,
    "estimatedTime" INTEGER, -- in hours/days
    "acceptedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.6 Tracking Table (Repair Lifecycle Tracking Logs)
CREATE TABLE IF NOT EXISTS "Tracking" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "repairRequestId" UUID REFERENCES "RepairRequest"(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.7 Device Listing (Marketplace / Sales)
CREATE TABLE IF NOT EXISTS "DeviceSale" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    "shopId" UUID REFERENCES "Shops"(id) ON DELETE SET NULL,
    device TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    "pointsAwarded" INTEGER DEFAULT 0,
    "cashAwarded" NUMERIC(10,2) DEFAULT 0,
    "piecesAvailable" INTEGER DEFAULT 1,
    "imageUrls" TEXT[] DEFAULT '{}',
    condition condition_type DEFAULT 'Used',
    status sale_status DEFAULT 'pending',
    "listingFeePaid" BOOLEAN DEFAULT FALSE,
    "listingFeeAmount" NUMERIC(10,2) DEFAULT 20.00,
    "paymentStatus" TEXT DEFAULT 'pending' CHECK ("paymentStatus" IN ('pending', 'completed', 'waived', 'failed')),
    "mainCategory" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "serialNumber" TEXT UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.8 Stock Notification Table (Item Restock Subscriptions)
CREATE TABLE IF NOT EXISTS "StockNotification" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "saleId" UUID REFERENCES "DeviceSale"(id) ON DELETE CASCADE NOT NULL,
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    "userEmail" TEXT,
    "deviceTitle" TEXT,
    notified BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.9 Device Purchases (Marketplace Orders & Tracking)
CREATE TABLE IF NOT EXISTS "DevicePurchase" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "saleId" UUID REFERENCES "DeviceSale"(id) ON DELETE CASCADE NOT NULL,
    "buyerId" UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    status purchase_status DEFAULT 'pending',
    "trackingNumber" TEXT,
    "fulfillmentMethod" TEXT DEFAULT 'pickup',
    "shippingStatus" TEXT DEFAULT 'order_placed',
    "deliveryAddress" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.10 Custom Requests (Procurement for Custom / Out-of-stock Devices)
CREATE TABLE IF NOT EXISTS "CustomRequest" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    "preferredCondition" VARCHAR(50) DEFAULT 'Any',
    "budgetMax" NUMERIC(10,2),
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'offers_received', 'fulfilled', 'closed', 'cancelled')),
    "imageUrls" TEXT[] DEFAULT '{}',
    "offersCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.11 Custom Offers (Technician / Vendor Quotations)
CREATE TABLE IF NOT EXISTS "CustomOffer" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "CustomRequest"(id) ON DELETE CASCADE,
    "sellerId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    description TEXT,
    "deliveryDays" INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.12 Payments (Lipa Na M-Pesa STK Push & Webhook Audits)
CREATE TABLE IF NOT EXISTS "Payment" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'listing_fee', 'repair_payment', 'wallet_topup', etc.
    reference VARCHAR(100),    -- deviceId, repairRequestId, etc.
    "merchantRequestId" VARCHAR(100),
    "checkoutRequestId" VARCHAR(100) UNIQUE,
    "mpesaReceiptNumber" VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.13 Wallets Table
CREATE TABLE IF NOT EXISTS "Wallet" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance NUMERIC(10,2) DEFAULT 0.00,
    points INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.14 Transactions Table
CREATE TABLE IF NOT EXISTS "Transaction" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "walletId" UUID REFERENCES "Wallet"(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    type TEXT CHECK (type IN ('deposit', 'withdrawal', 'payment', 'redeem')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.15 Referrals Table
CREATE TABLE IF NOT EXISTS "Referral" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "referrerId" UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    "refereeId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "referredId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.16 Role Applications Table (For Technician & Delivery Onboarding)
CREATE TABLE IF NOT EXISTS "RoleApplication" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE NOT NULL,
    "requestedRole" user_role NOT NULL,
    phone TEXT,
    "shopId" UUID REFERENCES "Shops"(id) ON DELETE SET NULL,
    locality TEXT,
    "vehicleType" TEXT,
    "deliveryFrequency" TEXT,
    "preferredDevices" TEXT[] DEFAULT '{}',
    proficiency TEXT[] DEFAULT '{}',
    "experienceLevel" TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    documents TEXT[] DEFAULT '{}',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.17 Shared Static Data (Device Types & Models)
CREATE TABLE IF NOT EXISTS "DeviceTypes" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "DeviceModels" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    "deviceTypeId" UUID REFERENCES "DeviceTypes"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, brand)
);

-- 3.18 Service Inquiries & Infrastructure Applications
CREATE TABLE IF NOT EXISTS "ServiceInquiry" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "clientName" VARCHAR(255) NOT NULL,
    "clientEmail" VARCHAR(255) NOT NULL,
    "clientPhone" VARCHAR(50) NOT NULL,
    "serviceType" VARCHAR(100) NOT NULL,
    "targetEntity" VARCHAR(50) DEFAULT 'business',
    "locationTown" VARCHAR(100),
    "locationAddress" TEXT,
    "urgency" VARCHAR(20) DEFAULT 'medium',
    "budget" NUMERIC(12,2) DEFAULT NULL,
    "quotationKes" NUMERIC(12,2) DEFAULT NULL,
    "details" JSONB DEFAULT '{}'::jsonb,
    "status" VARCHAR(50) DEFAULT 'pending',
    "notes" TEXT DEFAULT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "ServiceInquiry" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. COLUMN SYNCHRONIZATION (Ensures Existing Tables Gain Newly Added Columns)
-- ==============================================================================

-- Synchronize "DeviceSale"
ALTER TABLE "DeviceSale" 
ADD COLUMN IF NOT EXISTS "piecesAvailable" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "listingFeePaid" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "listingFeeAmount" NUMERIC(10,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending';

-- Synchronize "DevicePurchase"
ALTER TABLE "DevicePurchase"
ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
ADD COLUMN IF NOT EXISTS "fulfillmentMethod" TEXT DEFAULT 'pickup',
ADD COLUMN IF NOT EXISTS "shippingStatus" TEXT DEFAULT 'order_placed',
ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;

-- Synchronize "Shops"
ALTER TABLE "Shops" 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "statusNote" TEXT DEFAULT NULL;

-- Synchronize "Technicians"
ALTER TABLE "Technicians" 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "statusNote" TEXT DEFAULT NULL;

-- Synchronize "DeliveryPersonnel"
ALTER TABLE "DeliveryPersonnel" 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "statusNote" TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Synchronize "Referral"
ALTER TABLE "Referral"
ADD COLUMN IF NOT EXISTS "refereeId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "referredId" UUID REFERENCES "User"(id) ON DELETE CASCADE;

-- ==============================================================================
-- 5. PERFORMANCE & SEARCH INDEXES (CREATE INDEX IF NOT EXISTS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_custom_request_status ON "CustomRequest"(status);
CREATE INDEX IF NOT EXISTS idx_custom_request_category ON "CustomRequest"(category);
CREATE INDEX IF NOT EXISTS idx_custom_request_user ON "CustomRequest"("userId");
CREATE INDEX IF NOT EXISTS idx_custom_offer_request ON "CustomOffer"("requestId");
CREATE INDEX IF NOT EXISTS idx_custom_offer_seller ON "CustomOffer"("sellerId");

CREATE INDEX IF NOT EXISTS idx_payment_checkout_req ON "Payment"("checkoutRequestId");
CREATE INDEX IF NOT EXISTS idx_payment_user ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"(status);

CREATE INDEX IF NOT EXISTS idx_stock_notif_sale ON "StockNotification"("saleId");
CREATE INDEX IF NOT EXISTS idx_stock_notif_user ON "StockNotification"("userId");

CREATE INDEX IF NOT EXISTS idx_repair_request_user ON "RepairRequest"("userId");
CREATE INDEX IF NOT EXISTS idx_repair_request_tech ON "RepairRequest"("technicianId");
CREATE INDEX IF NOT EXISTS idx_repair_request_shop ON "RepairRequest"("shopId");

CREATE INDEX IF NOT EXISTS idx_device_sale_user ON "DeviceSale"("userId");
CREATE INDEX IF NOT EXISTS idx_device_sale_status ON "DeviceSale"(status);

CREATE INDEX IF NOT EXISTS idx_device_purchase_buyer ON "DevicePurchase"("buyerId");
CREATE INDEX IF NOT EXISTS idx_device_purchase_sale ON "DevicePurchase"("saleId");

CREATE INDEX IF NOT EXISTS idx_tracking_repair ON "Tracking"("repairRequestId");
CREATE INDEX IF NOT EXISTS idx_role_app_user ON "RoleApplication"("userId");
CREATE INDEX IF NOT EXISTS idx_referral_referrer ON "Referral"("referrerId");

-- ==============================================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 6.1 Role verification helper (Declared early for RLS policies)
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, roles public.user_role[])
RETURNS BOOLEAN AS $$
  SELECT role = ANY(roles) FROM public."User" WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6.2 Automatic Profile and Wallet Creation on Auth Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, name, email, role, phone)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.email, 
    'user',
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public."User".phone);
  
  INSERT INTO public."Wallet" ("userId", balance, points)
  VALUES (new.id, 0.00, 0)
  ON CONFLICT ("userId") DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Re-enable Trigger on auth.users for Automatic Registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ==============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Technicians" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryPersonnel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RepairRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeviceSale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DevicePurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomOffer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeviceTypes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeviceModels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoleApplication" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY POLICIES (DROP IF EXISTS + RECREATE IDEMPOTENTLY)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 8.1 "User" Table Policies (Resolves 42501 on Registration / Profile Update)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
CREATE POLICY "Users can view their own profile" ON "User"
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON "User";
CREATE POLICY "Admins can view all profiles" ON "User"
    FOR SELECT USING (public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Users can insert their own profile" ON "User";
CREATE POLICY "Users can insert their own profile" ON "User"
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
CREATE POLICY "Users can update their own profile" ON "User"
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON "User";
CREATE POLICY "Admins can update all profiles" ON "User"
    FOR UPDATE USING (public.has_role(auth.uid(), '{admin}'));

-- ------------------------------------------------------------------------------
-- 8.2 "Shops" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view shops" ON "Shops";
CREATE POLICY "Public can view shops" ON "Shops"
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage shops" ON "Shops";
CREATE POLICY "Admins can manage shops" ON "Shops"
    FOR ALL USING (public.has_role(auth.uid(), '{admin}'));

-- ------------------------------------------------------------------------------
-- 8.3 "Technicians" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view technicians" ON "Technicians";
CREATE POLICY "Public can view technicians" ON "Technicians"
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins and shops can manage technicians" ON "Technicians";
CREATE POLICY "Admins and shops can manage technicians" ON "Technicians"
    FOR ALL USING (public.has_role(auth.uid(), '{admin, shop}'));

-- ------------------------------------------------------------------------------
-- 8.4 "DeliveryPersonnel" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view delivery personnel" ON "DeliveryPersonnel";
CREATE POLICY "Public can view delivery personnel" ON "DeliveryPersonnel"
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins and shops can manage delivery personnel" ON "DeliveryPersonnel";
CREATE POLICY "Admins and shops can manage delivery personnel" ON "DeliveryPersonnel"
    FOR ALL USING (public.has_role(auth.uid(), '{admin, shop}'));

-- ------------------------------------------------------------------------------
-- 8.5 "RepairRequest" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own repairs" ON "RepairRequest";
CREATE POLICY "Users can view their own repairs" ON "RepairRequest"
    FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert their own repairs" ON "RepairRequest";
CREATE POLICY "Users can insert their own repairs" ON "RepairRequest"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Shops and Admins can manage repairs" ON "RepairRequest";
CREATE POLICY "Shops and Admins can manage repairs" ON "RepairRequest"
    FOR ALL USING (public.has_role(auth.uid(), '{admin, shop}'));

DROP POLICY IF EXISTS "Technicians can view assigned repairs" ON "RepairRequest";
CREATE POLICY "Technicians can view assigned repairs" ON "RepairRequest"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM "Technicians" WHERE id = "technicianId" AND "userId" = auth.uid())
    );

DROP POLICY IF EXISTS "Technicians can update assigned repairs" ON "RepairRequest";
CREATE POLICY "Technicians can update assigned repairs" ON "RepairRequest"
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM "Technicians" WHERE id = "technicianId" AND "userId" = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 8.6 "Tracking" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tracking for their repairs" ON "Tracking";
CREATE POLICY "Users can view tracking for their repairs" ON "Tracking"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "RepairRequest" 
            WHERE "RepairRequest".id = "Tracking"."repairRequestId" 
            AND ("RepairRequest"."userId" = auth.uid() OR public.has_role(auth.uid(), '{admin, shop, technician}'))
        )
    );

DROP POLICY IF EXISTS "Staff can insert tracking logs" ON "Tracking";
CREATE POLICY "Staff can insert tracking logs" ON "Tracking"
    FOR INSERT WITH CHECK (
        public.has_role(auth.uid(), '{admin, shop, technician, delivery}')
    );

-- ------------------------------------------------------------------------------
-- 8.7 "DeviceSale" Table Policies (Marketplace)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view approved listings" ON "DeviceSale";
CREATE POLICY "Public can view approved listings" ON "DeviceSale"
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view their own listings" ON "DeviceSale";
CREATE POLICY "Users can view their own listings" ON "DeviceSale"
    FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Admins can view all listings" ON "DeviceSale";
CREATE POLICY "Admins can view all listings" ON "DeviceSale"
    FOR SELECT USING (public.has_role(auth.uid(), '{admin, shop}'));

DROP POLICY IF EXISTS "Users can insert their own listings" ON "DeviceSale";
CREATE POLICY "Users can insert their own listings" ON "DeviceSale"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Admins can insert any listing" ON "DeviceSale";
CREATE POLICY "Admins can insert any listing" ON "DeviceSale"
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), '{admin, shop}'));

DROP POLICY IF EXISTS "Users can update their own listings" ON "DeviceSale";
CREATE POLICY "Users can update their own listings" ON "DeviceSale"
    FOR UPDATE USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Admins can update any listing" ON "DeviceSale";
CREATE POLICY "Admins can update any listing" ON "DeviceSale"
    FOR UPDATE USING (public.has_role(auth.uid(), '{admin, shop}'));

DROP POLICY IF EXISTS "Admins can delete any listing" ON "DeviceSale";
CREATE POLICY "Admins can delete any listing" ON "DeviceSale"
    FOR DELETE USING (public.has_role(auth.uid(), '{admin}'));

-- ------------------------------------------------------------------------------
-- 8.8 "StockNotification" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view and manage their stock notifications" ON "StockNotification";
CREATE POLICY "Users can view and manage their stock notifications" ON "StockNotification"
    FOR ALL USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");

-- ------------------------------------------------------------------------------
-- 8.9 "DevicePurchase" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own purchases" ON "DevicePurchase";
CREATE POLICY "Users can view their own purchases" ON "DevicePurchase"
    FOR SELECT USING (auth.uid() = "buyerId");

DROP POLICY IF EXISTS "Admins and shops can view purchases" ON "DevicePurchase";
CREATE POLICY "Admins and shops can view purchases" ON "DevicePurchase"
    FOR SELECT USING (public.has_role(auth.uid(), '{admin, shop}'));

DROP POLICY IF EXISTS "Users can insert their own purchases" ON "DevicePurchase";
CREATE POLICY "Users can insert their own purchases" ON "DevicePurchase"
    FOR INSERT WITH CHECK (auth.uid() = "buyerId");

DROP POLICY IF EXISTS "Admins can update purchases" ON "DevicePurchase";
CREATE POLICY "Admins can update purchases" ON "DevicePurchase"
    FOR UPDATE USING (public.has_role(auth.uid(), '{admin, shop}'));

-- ------------------------------------------------------------------------------
-- 8.10 "CustomRequest" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view open custom requests" ON "CustomRequest";
CREATE POLICY "Anyone can view open custom requests" ON "CustomRequest"
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can create custom requests" ON "CustomRequest";
CREATE POLICY "Authenticated users can create custom requests" ON "CustomRequest"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update their own custom requests" ON "CustomRequest";
CREATE POLICY "Users can update their own custom requests" ON "CustomRequest"
    FOR UPDATE USING (auth.uid() = "userId" OR public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Users can delete their own custom requests" ON "CustomRequest";
CREATE POLICY "Users can delete their own custom requests" ON "CustomRequest"
    FOR DELETE USING (auth.uid() = "userId" OR public.has_role(auth.uid(), '{admin}'));

-- ------------------------------------------------------------------------------
-- 8.11 "CustomOffer" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Request owner and offer seller can view offers" ON "CustomOffer";
CREATE POLICY "Request owner and offer seller can view offers" ON "CustomOffer"
    FOR SELECT USING (
        auth.uid() = "sellerId" OR 
        EXISTS (
            SELECT 1 FROM "CustomRequest" 
            WHERE "CustomRequest".id = "CustomOffer"."requestId" 
            AND "CustomRequest"."userId" = auth.uid()
        ) OR
        public.has_role(auth.uid(), '{admin}')
    );

DROP POLICY IF EXISTS "Authenticated users can submit offers" ON "CustomOffer";
CREATE POLICY "Authenticated users can submit offers" ON "CustomOffer"
    FOR INSERT WITH CHECK (auth.uid() = "sellerId");

DROP POLICY IF EXISTS "Sellers can update their own offers" ON "CustomOffer";
CREATE POLICY "Sellers can update their own offers" ON "CustomOffer"
    FOR UPDATE USING (auth.uid() = "sellerId" OR public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Request owners can update offer status (accept/reject)" ON "CustomOffer";
CREATE POLICY "Request owners can update offer status (accept/reject)" ON "CustomOffer"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "CustomRequest" 
            WHERE "CustomRequest".id = "CustomOffer"."requestId" 
            AND "CustomRequest"."userId" = auth.uid()
        ) OR
        public.has_role(auth.uid(), '{admin}')
    );

-- ------------------------------------------------------------------------------
-- 8.12 "Payment" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own payments" ON "Payment";
CREATE POLICY "Users can view their own payments" ON "Payment"
    FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Admins can view all payments" ON "Payment";
CREATE POLICY "Admins can view all payments" ON "Payment"
    FOR SELECT USING (public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Authenticated users can initiate payments" ON "Payment";
CREATE POLICY "Authenticated users can initiate payments" ON "Payment"
    FOR INSERT WITH CHECK (auth.uid() = "userId" OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage payments" ON "Payment";
CREATE POLICY "Admins can manage payments" ON "Payment"
    FOR ALL USING (public.has_role(auth.uid(), '{admin}'));

-- ------------------------------------------------------------------------------
-- 8.13 "Wallet" Table Policies (Resolves 42501 on Wallet Creation & Updates)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own wallet" ON "Wallet";
CREATE POLICY "Users can view their own wallet" ON "Wallet"
    FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Admins can view all wallets" ON "Wallet";
CREATE POLICY "Admins can view all wallets" ON "Wallet"
    FOR SELECT USING (public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Users can insert their own wallet" ON "Wallet";
CREATE POLICY "Users can insert their own wallet" ON "Wallet"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update their own wallet" ON "Wallet";
CREATE POLICY "Users can update their own wallet" ON "Wallet"
    FOR UPDATE USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");

-- ------------------------------------------------------------------------------
-- 8.14 "Transaction" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own transactions" ON "Transaction";
CREATE POLICY "Users can view their own transactions" ON "Transaction"
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM "Wallet" WHERE "Wallet".id = "Transaction"."walletId" AND "Wallet"."userId" = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all transactions" ON "Transaction";
CREATE POLICY "Admins can view all transactions" ON "Transaction"
    FOR SELECT USING (public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Users can insert their own transactions" ON "Transaction";
CREATE POLICY "Users can insert their own transactions" ON "Transaction"
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM "Wallet" WHERE "Wallet".id = "Transaction"."walletId" AND "Wallet"."userId" = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can insert transactions" ON "Transaction";
CREATE POLICY "Admins can insert transactions" ON "Transaction"
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), '{admin}'));

-- ------------------------------------------------------------------------------
-- 8.15 "Referral" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view referrals where they are referrer" ON "Referral";
CREATE POLICY "Users can view referrals where they are referrer" ON "Referral"
    FOR SELECT USING (auth.uid() = "referrerId" OR auth.uid() = "refereeId" OR auth.uid() = "referredId");

DROP POLICY IF EXISTS "Admins can manage referrals" ON "Referral";
CREATE POLICY "Admins can manage referrals" ON "Referral"
    FOR ALL USING (public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Authenticated users can create referrals" ON "Referral";
CREATE POLICY "Authenticated users can create referrals" ON "Referral"
    FOR INSERT WITH CHECK (auth.uid() = "refereeId" OR auth.uid() = "referredId" OR auth.uid() = "referrerId");

-- ------------------------------------------------------------------------------
-- 8.16 "RoleApplication" Table Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own role applications" ON "RoleApplication";
CREATE POLICY "Users can view their own role applications" ON "RoleApplication"
    FOR SELECT USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Admins can view all role applications" ON "RoleApplication";
CREATE POLICY "Admins can view all role applications" ON "RoleApplication"
    FOR SELECT USING (public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Users can create role applications" ON "RoleApplication";
CREATE POLICY "Users can create role applications" ON "RoleApplication"
    FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Admins can manage role applications" ON "RoleApplication";
CREATE POLICY "Admins can manage role applications" ON "RoleApplication"
    FOR ALL USING (public.has_role(auth.uid(), '{admin}'));

-- ------------------------------------------------------------------------------
-- 8.17 "DeviceTypes" and "DeviceModels" Static Data Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view device types" ON "DeviceTypes";
CREATE POLICY "Public can view device types" ON "DeviceTypes"
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage device types" ON "DeviceTypes";
CREATE POLICY "Admins can manage device types" ON "DeviceTypes"
    FOR ALL USING (public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Public can view device models" ON "DeviceModels";
CREATE POLICY "Public can view device models" ON "DeviceModels"
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage device models" ON "DeviceModels";
CREATE POLICY "Admins can manage device models" ON "DeviceModels"
    FOR ALL USING (public.has_role(auth.uid(), '{admin}'));

-- 8.19 "ServiceInquiry" Table Policies
DROP POLICY IF EXISTS "Anyone can submit a service inquiry" ON "ServiceInquiry";
CREATE POLICY "Anyone can submit a service inquiry" ON "ServiceInquiry"
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own service inquiries" ON "ServiceInquiry";
CREATE POLICY "Users can view their own service inquiries" ON "ServiceInquiry"
    FOR SELECT USING (auth.uid() = "userId" OR public.has_role(auth.uid(), '{admin}'));

DROP POLICY IF EXISTS "Admins can update service inquiries" ON "ServiceInquiry";
CREATE POLICY "Admins can update service inquiries" ON "ServiceInquiry"
    FOR UPDATE USING (public.has_role(auth.uid(), '{admin}'));

-- ==============================================================================
-- 9. STORAGE BUCKET POLICIES (Reference Documentation for Supabase Storage)
-- ==============================================================================
/*
-- Run in Supabase SQL editor if 'device-media' bucket exists:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('device-media', 'device-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'device-media');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'device-media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner/Admin Delete" ON storage.objects;
CREATE POLICY "Owner/Admin Delete" ON storage.objects 
    FOR DELETE USING (bucket_id = 'device-media' AND (auth.uid() = owner OR public.has_role(auth.uid(), '{admin}')));
*/

-- ==============================================================================
-- END OF COMPLETE SCHEMA SPECIFICATION
-- ==============================================================================
