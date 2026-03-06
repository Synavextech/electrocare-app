---
trigger: always_on
---

## Tech-Stack
# Frontend
- Framework: React
- Build Tool: Vite
- Language: TypeScript
- Routing: react router
- State Management: TanStack Query
- UI Components: Radix UI / Shadcn UI
- Styling: TailwindCSS with Animate.css
- Animations: Framer Motion
- Forms: React Hook Form with Zod validation
- PWA: Vite Plugin PWA for offline capabilities and installation
# Backend
- Runtime: Node.js
- Framework: Express
- Language: TypeScript
- Database SDK: @supabase/supabase-js
- Authentication: @supabase/ssr-auth
- logicc: PostgreSQL Hooks
# Database config & Features
Provider: Supabase (PostgreSQL)
    - Row Level Security (RLS): Enabled on all core tables for secure data access.
    - Custom Types/Enums: Used for roles, status etc.
    - Triggers: Automated user profile, and wallet creation upon auth registration.
## Architecture Authentication & Authorization configuration
- **Authentication**: @supabase/ssr
    - Auth Flow: React (Frontend) → Supabase Auth → Browser Cookie.
- Verification: Express (Backend) reads the cookie → Validates with Supabase →  Identifies User/Role.
- RBAC: Handled via PostgreSQL Enums and RLS Policies.
- Password hashing using bcrypt for secure storage
- **Input Validation**: Using Zod for schema validation on both front-end and back-end
- **PWA support** for mobile-first experience
- **Dark/Light Theme** - Customizable UI experience 
- **Responsive Design** - Mobile-first approach
# Communications
- Email Service: Integrates with Supabase's built-in email features

Electrocare.tech
- This is a mobile repair and sales shop management platform that help users book for mobile repair services with delivery feature and walk in options.
- It is integrated with an e-commerce system to manage the sell and purchase of phones.
- Device repair booking is integrated with a track my device progress feature.
- All sale requests are admin directed and admin handle all the selling process.
- **Assignment**: System assigns Technician/Shop/Deliverypersonel → changes updates status (WebSockets notify User).
- **Device Sale**: User submits → Shop/Tech/admin verifies → approves → Awards to Wallet (points/cash).
 **Referral**: User shares code → New user registers/action → API awards 10 points to referrer's Wallet.
 **Wallet Management**: Wallet fetches balance/transactions → Redeem for repairs → Withdraw manual admin approve.

## E-R for design and UI backend integration
- **User**: Has Wallet (1:1), many RepairRequests (1:N), many Referrals (1:N), many DeviceSales (1:N). Refers other Users (N:N via Referral).
- **Technician**: Belongs to Shop (N:1), has many RepairRequests (1:N), Earnings (1:1, linked to Wallet-like structure), can accept repair request, can approve device posting listing
- **DeliveryPersonnel**: Types (RealTime/OneTime). Has many Deliveries (1:N). Linked to RepairRequest (N:1).
- **Shop**: Has many Technicians (1:N), many Deliveries (1:N), manages DeviceSales (1:N via verification)., can accept repair request
- **RepairRequest**: Belongs to User (N:1), Technician (N:1), Shop (N:1), Delivery (N:1). Status: pending/in_progress/completed. Linked to Payment (1:1), Tracking (1:1).
- **Device**: Belongs to User (N:1), linked to RepairRequest (N:1)/DeviceSale (N:1).
- **DeviceSale**: Belongs to User (N:1), approved by Admin/Shop/technician (N:1). Awards Points/Cash to User's Wallet - ensure it updates appropriately
- **Wallet**: Belongs to User (1:1). Tracks balance, points (from Referral/DeviceSale). Linked to Transactions
- **Referral**: From User to User (N:N). Awards points on completion
- **Payment**: Belongs to RepairRequest (1:1). Types: online (discount), COD/walk-in.
    -  **Payment**: Online via API (apply 10% discount) → Triggers Wallet debit if points redeemed.
- **Tracking**: Belongs to RepairRequest (1:1). Uses WebSockets for real-time updates.
    -  **Tracking**: Initial fetch (React Quer) → Subscribe WebSockets for live updates.