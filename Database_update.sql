-- ==============================================================================
-- ELECTROCARE DATABASE UPDATE MIGRATION SCRIPT
-- Phase 8: Service Inquiries, Custom Software, AI, ISP Management,
-- Electron Network & Satellite Broadband Infrastructure Applications
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "ServiceInquiry" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "clientName" VARCHAR(255) NOT NULL,
    "clientEmail" VARCHAR(255) NOT NULL,
    "clientPhone" VARCHAR(50) NOT NULL,
    "serviceType" VARCHAR(100) NOT NULL, -- 'software_custom_app', 'ai_configuration', 'isp_management', 'electron_network', 'satellite_internet'
    "targetEntity" VARCHAR(50) DEFAULT 'business', -- 'home', 'office', 'institution', 'business', 'enterprise'
    "locationTown" VARCHAR(100),
    "locationAddress" TEXT,
    "urgency" VARCHAR(20) DEFAULT 'medium',
    "budget" NUMERIC(12,2) DEFAULT NULL,
    "quotationKes" NUMERIC(12,2) DEFAULT NULL,
    "details" JSONB DEFAULT '{}'::jsonb,
    "status" VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'contacted', 'in_progress', 'completed', 'cancelled'
    "notes" TEXT DEFAULT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_inquiry_type ON "ServiceInquiry"("serviceType");
CREATE INDEX IF NOT EXISTS idx_service_inquiry_user ON "ServiceInquiry"("userId");
CREATE INDEX IF NOT EXISTS idx_service_inquiry_status ON "ServiceInquiry"("status");
CREATE INDEX IF NOT EXISTS idx_service_inquiry_created ON "ServiceInquiry"("createdAt");

ALTER TABLE "ServiceInquiry" ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated visitors can submit service inquiries
DROP POLICY IF EXISTS "Anyone can submit a service inquiry" ON "ServiceInquiry";
CREATE POLICY "Anyone can submit a service inquiry" ON "ServiceInquiry"
    FOR INSERT WITH CHECK (true);

-- Authenticated users can view their own inquiries, admins can view all
DROP POLICY IF EXISTS "Users can view their own service inquiries" ON "ServiceInquiry";
CREATE POLICY "Users can view their own service inquiries" ON "ServiceInquiry"
    FOR SELECT USING (auth.uid() = "userId" OR public.has_role(auth.uid(), '{admin}'));

-- Admins can update/manage all service inquiries
DROP POLICY IF EXISTS "Admins can update service inquiries" ON "ServiceInquiry";
CREATE POLICY "Admins can update service inquiries" ON "ServiceInquiry"
    FOR UPDATE USING (public.has_role(auth.uid(), '{admin}'));

-- ==============================================================================
-- END OF PHASE 8 MIGRATION
-- ==============================================================================
