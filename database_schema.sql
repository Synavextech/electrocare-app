-- ElectroCare Database Schema for Supabase

-- Enable RLS
-- alter table "auth"."users" enable row level security; -- Removed to prevent permission error

-- Public Profiles table (linked to auth.users)
CREATE TABLE public."User" (
  "id" UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "role" TEXT DEFAULT 'user', -- 'admin', 'user', 'technician', 'shop', 'delivery'
  "referralCode" TEXT UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for User table
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
ON public."User" FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public."User" FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public."User" FOR UPDATE
USING (auth.uid() = id);

-- Professional roles can view their own data and related entities (handled by specific table policies)
-- Admin policies already exist in the file but let's ensure they are clear.


CREATE POLICY "Admins can view all profiles"
ON public."User" FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update all profiles"
ON public."User" FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Wallets table
CREATE TABLE public."Wallet" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public."User"("id") ON DELETE CASCADE UNIQUE NOT NULL,
  "balance" DECIMAL DEFAULT 0,
  "points" INTEGER DEFAULT 0,
  "electroCoins" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Wallet" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
ON public."Wallet" FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own wallet"
ON public."Wallet" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own wallet"
ON public."Wallet" FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "Admins can view all wallets"
ON public."Wallet" FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- RepairRequests table
CREATE TABLE public."RepairRequest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id" TEXT UNIQUE NOT NULL,
  "userId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "technicianId" TEXT, -- ID from JSON file
  "shopId" TEXT, -- ID from JSON file
  "deliveryPersonnelId" TEXT, -- ID from JSON file
  "device_type" TEXT NOT NULL, -- e.g. Mobile Phone, Laptop
  "device_model" TEXT, -- Specific model
  "issue" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending', -- pending, accepted, in_repair, repair_complete, in_transit, completed
  "delivery" BOOLEAN DEFAULT false,
  "trackingNumber" TEXT,
  "cost" DECIMAL,
  "paymentMethod" TEXT DEFAULT 'cod',
  "discount" DECIMAL DEFAULT 0,
  "estimatedTime" INTEGER, -- in minutes
  "acceptedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."RepairRequest" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own repair requests"
ON public."RepairRequest" FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can create repair requests"
ON public."RepairRequest" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Admins can view all repair requests"
ON public."RepairRequest" FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update all repair requests"
ON public."RepairRequest" FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Payments table
CREATE TABLE public."Payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "repairRequestId" UUID REFERENCES public."RepairRequest"("id") ON DELETE CASCADE UNIQUE NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON public."Payment" FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public."RepairRequest" r
  WHERE r.id = "repairRequestId" AND r."userId" = auth.uid()
));

CREATE POLICY "Admins can view all payments"
ON public."Payment" FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Tracking table
CREATE TABLE public."Tracking" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "repairRequestId" UUID REFERENCES public."RepairRequest"("id") ON DELETE CASCADE UNIQUE NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Tracking" ENABLE ROW LEVEL SECURITY;

-- Transactions table
CREATE TABLE public."Transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId" UUID REFERENCES public."Wallet"("id") ON DELETE CASCADE NOT NULL,
  "amount" DECIMAL NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public."Transaction" FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public."Wallet" w
  WHERE w.id = "walletId" AND w."userId" = auth.uid()
));

CREATE POLICY "Users can insert own transactions"
ON public."Transaction" FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public."Wallet" w
  WHERE w.id = "walletId" AND w."userId" = auth.uid()
));

CREATE POLICY "Admins can view all transactions"
ON public."Transaction" FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Referrals table
CREATE TABLE public."Referral" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "referrerId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "refereeId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Referral" ENABLE ROW LEVEL SECURITY;

-- DeviceSales table
CREATE TABLE public."DeviceSale" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "device" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL NOT NULL,
  "imageUrls" JSONB DEFAULT '[]', -- Array of up to 5 image URLs
  "condition" TEXT,
  "category" TEXT, -- Mobile Phone, Laptop, etc.
  "subCategory" TEXT, -- Brand/Model if needed for branching
  "serialNumber" TEXT,
  "status" TEXT DEFAULT 'pending', -- pending, approved, rejected, sold
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DevicePurchases table
CREATE TABLE public."DevicePurchase" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "saleId" UUID REFERENCES public."DeviceSale"("id") ON DELETE CASCADE NOT NULL,
  "buyerId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "status" TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  "price" DECIMAL NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."DevicePurchase" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
ON public."DevicePurchase" FOR SELECT
USING (auth.uid() = "buyerId");

CREATE POLICY "Users can create purchase requests"
ON public."DevicePurchase" FOR INSERT
WITH CHECK (auth.uid() = "buyerId");

CREATE POLICY "Admins, Shops, Techs can view related purchases"
ON public."DevicePurchase" FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'shop', 'technician'));

CREATE POLICY "Admins, Shops, Techs can update purchases"
ON public."DevicePurchase" FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'shop', 'technician'));

ALTER TABLE public."DeviceSale" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved listings"
ON public."DeviceSale" FOR SELECT
USING (status = 'approved' OR auth.uid() = "userId");

CREATE POLICY "Users can create their own listings"
ON public."DeviceSale" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own listings"
ON public."DeviceSale" FOR UPDATE
USING (auth.uid() = "userId");

CREATE POLICY "Admins can manage all listings"
ON public."DeviceSale" FOR ALL
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Notifications table
CREATE TABLE public."Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

-- Friendship table
CREATE TABLE public."Friendship" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "friendId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "status" TEXT DEFAULT 'pending', -- pending, accepted, blocked
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "friendId")
);

ALTER TABLE public."Friendship" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
ON public."Friendship" FOR SELECT
USING (auth.uid() = "userId" OR auth.uid() = "friendId");

CREATE POLICY "Users can create friend requests"
ON public."Friendship" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own friendships"
ON public."Friendship" FOR UPDATE
USING (auth.uid() = "userId" OR auth.uid() = "friendId");

-- RoleApplications table
CREATE TABLE public."RoleApplication" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES public."User"("id") ON DELETE CASCADE NOT NULL,
  "requestedRole" TEXT NOT NULL, -- 'technician', 'delivery'
  "status" TEXT DEFAULT 'pending', -- pending, approved, rejected
  "documents" JSONB DEFAULT '[]', -- Array of document URLs
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public."RoleApplication" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
ON public."RoleApplication" FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can create own applications"
ON public."RoleApplication" FOR INSERT
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Admins can view all applications"
ON public."RoleApplication" FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update all applications"
ON public."RoleApplication" FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Storage Buckets Configuration
-- Note: These usually need to be run in the Supabase SQL editor or via API

-- Create buckets for media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('device-media', 'device-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('repair-attachments', 'repair-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'device-media' OR bucket_id = 'repair-attachments' );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' AND (bucket_id = 'device-media' OR bucket_id = 'repair-attachments') );

-- Function and trigger removed to prevent permission error. User creation will be handled via Edge Function/API.