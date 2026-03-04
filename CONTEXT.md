# EMPREP — Application Context

## What It Is

EMPREP is an emergency preparedness supply service. The business:
- Sells and delivers pre-assembled supply kits and individual preparedness items
- Dispatches technicians to conduct in-home evaluations
- Performs periodic follow-up visits to check and replenish customer supplies
- Tracks what supplies each customer has on hand and when items expire

## Who Uses It

| Role | Access | Description |
|---|---|---|
| **Customer** | Customer Portal (`/portal`) | Household or individual buying supplies and scheduling technician visits |
| **Employee** | Ops Dashboard (`/ops`) | Field technician — sees their own appointments, records visit details |
| **Admin** | Ops Dashboard (`/ops`) | Office staff — full access to all customers, employees, orders, catalog |

## The Two Interfaces

### Customer Portal
A self-service web app where customers:
- Browse and purchase supply kits and individual items
- Book initial evaluations and follow-up appointments
- View their supply inventory and upcoming appointment schedule
- Manage their account and order history

Key portal routes: `dashboard`, `catalog`, `appointments`, `orders`, `account`

### Ops Dashboard
An internal tool for employees and admins to:
- View and manage all appointments (or just their own, for employees)
- Record visit details, supply actions taken, and follow-up plans
- Manage the customer list and supply records
- Administer the product catalog and employee roster

Key ops routes: `dashboard`, `appointments`, `customers`, `catalog`, `employees`, `orders`

## Product Catalog

Supply items are organized into categories:

| Category | Examples |
|---|---|
| Kits | Pre-assembled household emergency kits |
| Water & Hydration | 5-gal storage containers, purification tablets, portable filters |
| Food & Nutrition | 3-day ration bars, 7-day freeze-dried meal packs |
| Medical & First Aid | 200-piece first aid kits, N95 respirators |
| Shelter & Warmth | Emergency blankets, ponchos, portable shelter |
| Communications & Power | Hand-crank radios, power banks, solar chargers |
| Documents & Finances | Waterproof document storage |

Items have SKUs, unit prices, shelf life (in months), and descriptions.

## Core Business Flows

### 1. New Customer Onboarding
1. Customer signs up and completes onboarding
2. Books an initial evaluation appointment
3. Technician visits, assesses household needs, recommends supplies
4. Customer purchases a kit or individual items
5. Supplies are delivered or handed off at visit

### 2. Follow-up Visit
1. System schedules a follow-up based on the follow-up plan set at last visit
2. Technician visits to check supply levels and expiry dates
3. Technician records visit: what was checked, restocked, or replaced
4. Next follow-up date is set

### 3. Order Fulfillment
1. Customer places order via portal (Stripe payment)
2. Order appears in ops dashboard
3. Items are delivered or picked up at next appointment

## Tech Stack

- **Web app:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Auth & Database:** Supabase (Postgres + Row-Level Security)
- **Payments:** Stripe (Payment Intents for orders)
- **Monorepo:** Turborepo + pnpm workspaces
- **Shared packages:** `packages/api` (service layer), `packages/types` (TypeScript types)

## Key Constraints

- All data access goes through Supabase RLS — customers can only see their own data
- Employees can only see their own appointments; admins see everything
- Authentication uses JWT with a custom `user_role` claim (`customer`, `employee`, `admin`)
- The ops dashboard enforces staff-only access at the middleware level
