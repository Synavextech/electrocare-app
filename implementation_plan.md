# ElectroCare Platform Streamlining & Production Readiness Implementation Plan

> **Note for Review**: This implementation plan is organized into orderly, relational phases. You can review, add comments, or request adjustments to any section before we begin execution.

---

## Phase 1: Navigation Dropdown, User Profile & Referral System [COMPLETED]
- **File(s)**:
  - `client/src/hooks/useAuth.ts`
  - `client/src/contexts/AuthContext.tsx`
  - `client/src/components/TopNav.tsx`
  - `server/controllers/auth.ts`
- **Status**: Completed. Fully populates phone, referral code, wallet balance, and points in TopNav dropdown with 1-click invite link copying.

---

## Phase 2: Currency Streamlining & Marketplace Differentiation [COMPLETED]
- **File(s)**:
  - `client/src/pages/Landing.tsx`
  - `client/src/pages/MarketplacePage.tsx`
  - `client/src/pages/Shopdashboard.tsx`
  - `client/src/pages/Techniciandashboard.tsx`
  - `client/src/pages/DeliveryPersonneldashboard.tsx`
  - `client/src/pages/AdminDashboard.tsx`
- **Status**: Completed. All legacy dollar references eradicated across all portals; standardized to Kenya Shillings (`KES`). Landing page features hot offers in horizontal scrollable rows per category.

---

## Phase 3: Trade & Purchase Lifecycle, Stock & Post-Purchase Tracking [COMPLETED]
- **File(s)**:
  - `client/src/pages/MarketplacePage.tsx`
  - `server/controllers/marketplace.ts`
  - `server/services/mpesa.ts`
  - `client/src/pages/Tracking.tsx`
  - `client/src/components/TrackingInterface.tsx`
  - `Database_update.sql`
- **Status**: Completed. Purchases generate tracking codes (`TRK-...`), shipping statuses, walk-in pickup / courier dispatch options, and dual tracking interface in `/tracking` with courier map telemetry.

---

## Phase 4: Wallet Automation (Dead Phone Awards & Real-time Top-Up) [COMPLETED]
- **File(s)**:
  - `client/src/pages/Wallet.tsx`
  - `server/controllers/wallet.ts`
  - `server/controllers/admin.ts`
  - `server/services/mpesa.ts`
- **Status**: Completed. Real-time balance updates via WebSocket `wallet_update` events and STK push status polling loop in modal. Automatic award of points/cash on dead device sale approvals.

---

## Phase 5: Shop Portal Enhancements [COMPLETED]
- **File(s)**:
  - `client/src/pages/Shopdashboard.tsx`
  - `server/controllers/admin.ts`
  - `server/routes/repairs.ts`
- **Status**: Completed. "Post New / Refurbished Device" modal, "Dead Phone Approvals" handler with custom points and cash awards, "Report Technician to Admin" modal, and delivery dispatch buttons implemented.

---

## Phase 6: End-to-End Production Verification & UI Polish [COMPLETED]
- **File(s)**:
  - `dist/` production bundles
  - `client/` and `server/` TypeScript builds
- **Status**: Completed and Verified. `npm run build` executed and passed cleanly with exit code 0 (`tsc && vite build` for client + `tsc` for server + PWA service worker generated).

---

## Phase 7: Database Schema Streamlining & Error 42710 Resolution [COMPLETED]
- **File(s)**:
  - `electrto_database_schema.sql` (Comprehensive independent schema script)
  - `Database_update.sql` (Main migration reference file)
- **Problem Statement**:
  - Executing `electrto_database_schema.sql` in Supabase fails with `ERROR: 42710: type "user_role" already exists` because PostgreSQL enum creation is not idempotent.
  - Furthermore, if executed multiple times or on an existing DB, policies and tables encounter duplicate object errors (`42710`).
  - `electrto_database_schema.sql` must act as an independent, all-in-one schema file that fully integrates and aligns with `Database_update.sql` (including `StockNotification`, `Tracking`, listing fee columns, stock management, fulfillment columns, missing RLS policies, and new user signup triggers).
- **Solution Implemented**:
  1. **Idempotent Enum Type Declarations**:
     - Wrapped all enum types (`user_role`, `repair_status`, `payment_status`, `sale_status`, `condition_type`, `purchase_status`) in `DO $$ BEGIN IF NOT EXISTS ... CREATE TYPE ... END $$;` blocks.
     - Added `ALTER TYPE ... ADD VALUE IF NOT EXISTS` for all labels.
  2. **Idempotent Table & Column Definitions**:
     - All tables use `CREATE TABLE IF NOT EXISTS` and include all latest fields.
     - Added missing tables: `StockNotification` (with restock notification features) and `Tracking` (for repair tracking logs).
     - Column sync via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for `DeviceSale`, `DevicePurchase`, `Shops`, `Technicians`, `DeliveryPersonnel`, and `Referral`.
  3. **Search & Audit Indexes**:
     - Added all 17 search and foreign key indexes idempotently using `CREATE INDEX IF NOT EXISTS`.
  4. **Security Definer Function & Trigger**:
     - Declared `has_role` before policies.
     - Implemented `handle_new_user()` trigger function with `ON CONFLICT` support for both profile and wallet generation.
     - Re-enabled `on_auth_user_created` trigger on `auth.users` safely using `DROP TRIGGER IF EXISTS`.
  5. **Idempotent Row Level Security (RLS)**:
     - Enabled RLS across all 18 tables.
     - Cleanly dropped and recreated all policies (`DROP POLICY IF EXISTS`), resolving errors 42710 and 42501.
- **Status**: Completed and ready for database execution.

---

## Phase 8: Software, Custom Applications, AI Configuration, ISP Management, Electron Network & Satellite Internet [IN PLANNING / READY FOR REVIEW]
- **User Requirements**:
  1. Add "Software and custom application" section below "Our Services" in the middle of the landing page.
  2. Integrated "Send Request" feature for Software and custom applications.
  3. AI configuration for business, home, or institution.
  4. ISP management system (billing, Mikrotik/PPPoE, bandwidth, vouchers).
  5. Get connected to Electron Network: unlimited internet access for home, offices, and institutions linked to a direct landingpage access button requesting client details and address location.
  6. Additional: Get connected to our satellite-based internet connection with:
     - "Check availability in my location" (default availability for all towns within proximity of ElectroCare service centers and site environments).
     - "See quotation" (instant transparent cost breakdown for hardware kit, installation, and monthly unlimited tiers).
     - "Apply for Satellite Connection" application workflow.
- **Affected Files**:
  - `Database_update.sql`: Idempotent schema migration for `"ServiceInquiry"` table.
  - `electrto_database_schema.sql`: Full synchronized schema definition with RLS policies and indexes.
  - `server/models/serviceInquiry.ts`: Zod schema validation and Supabase queries.
  - `server/controllers/serviceInquiry.ts`: Request handlers for submitting and querying service requests with live WebSocket broadcasts.
  - `server/middleware/optionalAuth.ts`: Middleware allowing both visitors and authenticated users to submit inquiries.
  - `server/routes/serviceInquiry.ts`: Route registration at `/api/service-inquiries`.
  - `server/app.ts`: Mount router in express app.
  - `client/src/components/ServiceInquiryModal.tsx`: Interactive modal for submitting software, AI, ISP, and network connection requests with live address, client details, and quotation options.
  - `client/src/components/SoftwareAndCustomAppsSection.tsx`: Core feature cards for Software, AI Configuration, ISP Management, Electron Network direct button, and Satellite Internet with built-in proximity availability checker and instant quotation breakdown.
  - `client/src/pages/Landing.tsx`: Embedded `<SoftwareAndCustomAppsSection />` directly below the "Our Service Delivery" section.
  - `client/src/pages/AdminDashboard.tsx`: Added "Service Inquiries" command tab allowing admins to view and update inquiry statuses.
- **Status**: Completed and Verified. `npm run build` executed and passed cleanly with exit code 0 (`tsc && vite build` for client + `tsc` for server + PWA service worker generated). Production ready.

---

## Phase 9: Production Build & Dependency Alignment for React 19 & TypeScript [READY FOR REVIEW]
- **File(s)**:
  - `package.json`: Move build-critical types and plugins to `dependencies`, align React 19 type definitions.
  - `package-lock.json`: Update lockfile to ensure reproducible deterministic installs across environments.
- **Problem Statement**:
  - In production (`/root/electrocare-app`), running `npm run build` fails with 7 TypeScript errors (`TS7016` on `framer-motion`, `TS2305` on `react-hook-form`'s `useForm`, and `TS2724` on `@hookform/resolvers/zod`'s `zodResolver`).
  - Because `NODE_ENV=production` is set in production deployment, `npm install` skips all `devDependencies`.
  - Type definitions (`@types/react`, `@types/react-dom`, `@types/node`) and Vite build plugins (`@vitejs/plugin-react`, `@tanstack/router-vite-plugin`, `@tailwindcss/postcss`, `autoprefixer`) were placed in `devDependencies`, starving `tsc` and `vite` during production builds.
  - Additionally, `@types/react` is currently locked to `^18.3.3` while React is at `^19.1.0`.
- **To-Do List**:
  1. **Update `package.json`**:
     - Promote `@types/react` and `@types/react-dom` to `dependencies` and align them with React 19 (`^19.0.0`).
     - Promote build plugins and core types required for the build script (`@vitejs/plugin-react`, `@tanstack/router-vite-plugin`, `@tailwindcss/postcss`, `autoprefixer`, `@types/node`) to `dependencies`.
     - Retain local-only development tools (`concurrently`, `nodemon`, `tsx`) in `devDependencies`.
  2. **Update lockfile & dependencies**:
     - Run `npm install` to update `package-lock.json` and sync the node modules.
  3. **Verification**:
     - Run `npm run build` (`tsc && vite build` for client, `tsc` for server) to verify zero TypeScript errors and clean build output.
- **Status**: Ready for review. Awaiting user confirmation to proceed with implementation and commands.
