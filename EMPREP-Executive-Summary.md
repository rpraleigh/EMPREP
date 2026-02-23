# EMPREP — Executive Summary

## What It Is

EMPREP is a full-stack emergency preparedness supply service platform. The business sells and delivers emergency supply kits to households, sends trained technicians for in-home evaluations and periodic follow-up visits, and tracks each customer's preparedness inventory over time.

---

## Business Model

- One-time product sales (emergency kits and add-on supplies) via Stripe checkout
- Recurring follow-up service visits on 3-month, 6-month, or 1-year intervals
- In-home evaluation appointments as the primary customer acquisition channel
- Upsell path from basic kits to premium bundles based on household needs and local hazard profile

---

## Customer Experience

Customers access a web portal and mobile app (iOS/Android) where they can:

- Complete an emergency preparedness intake profile covering household size, medical needs, pets, mobility limitations, power-dependent equipment, and more
- Use the **GUIDE ME** wizard to receive a personalized kit recommendation based on their location's hazard profile — flood, hurricane, wildfire, earthquake, tornado, and winter storm risk scored by US state and ZIP code
- Choose between a **Quick path** (instant recommendation from location alone) or a **Detailed walkthrough** (adds hazard acknowledgement, shelter duration preference, budget tier, and communication plan)
- Browse the supply catalog and purchase items directly via Stripe checkout
- Request and track appointments (evaluations, deliveries, follow-up visits)
- View their tracked supply inventory with color-coded expiry status
- Manage their follow-up service plan

---

## Operations

Staff access a separate web-based ops dashboard where they can:

- View and manage all appointments with full status tracking (requested → confirmed → in progress → completed)
- Assign appointments to technicians and set scheduled dates
- Complete visit records in the field — logging supply actions (delivered, found, recommended, removed, exchanged), writing visit summaries, and scheduling follow-up intervals
- Manage the supply catalog: create and edit items and kits, set pricing, activate or deactivate listings
- View customer profiles, supply inventories, and full appointment history
- Manage employee accounts with role-based access (admin vs. employee)
- Review and fulfill customer orders

---

## Technology

| Layer | Stack |
|---|---|
| Web app | Next.js 14 (App Router), deployed on Vercel |
| Mobile app | React Native via Expo SDK 51, structured for App Store and Play Store |
| Backend | Supabase (PostgreSQL, Auth, Row-Level Security) |
| Payments | Stripe (checkout sessions, webhook order fulfillment) |
| Monorepo | Turborepo + pnpm workspaces |

Role-based access control is enforced at every layer — customers, employees, and admins each see only what is relevant to their role. The ops dashboard and customer portal use separate login entry points.

---

## Current State

The platform is fully built and live. The web app is deployed to production on Vercel. The mobile app codebase is complete and ready for Expo build and app store submission. The database is cloud-hosted on Supabase with seed catalog data in place. All core workflows are functional end to end:

- Customer onboarding and profile setup
- GUIDE ME personalized hazard and kit recommendation engine
- Supply catalog browsing and Stripe checkout
- Appointment request, scheduling, and management
- Technician field visit completion with supply action logging
- Inventory tracking with expiry alerts
- Employee management and role-based ops access

---

## Key Differentiators

- **Localized hazard intelligence** — recommendations are tailored to the customer's actual risk profile by state and ZIP code, not generic checklists
- **Service model** — ongoing technician visits create a recurring revenue stream and deepen customer relationships beyond a one-time sale
- **Full-stack ownership** — the platform, catalog, scheduling, and customer relationship management are all proprietary, with no dependency on third-party field service software
