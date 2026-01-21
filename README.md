# building-material-app

A production-style web app for a building materials business that centralizes rates, products, ordering, billing, and admin operations in one interface.

## What it does
- Browses products and categories with a customer-facing flow
- Manages carts, orders, and billing
- Tracks daily material rates and provides a rate board
- Supports admin tools like customer management, bill scanning, and settings
- Includes authentication with role-aware access

## Key features
- Role-based access (admin/customer)
- Rate management and product catalog
- Cart, orders, and billing flows
- Admin dashboard and settings
- TMT calculator for material estimation
- Voice assistant entrypoint for admin users

## Tech stack
- Frontend: React, TypeScript, Vite
- UI: Tailwind CSS, shadcn/ui (Radix UI)
- State/Data: TanStack React Query
- Forms/Validation: React Hook Form, Zod
- Backend/Auth: Supabase
- Routing: React Router
- Mobile readiness: Capacitor

## How to run
```bash
npm install
npm run dev
```

## Project structure
- `src/components/` feature modules (products, orders, billing, admin)
- `src/hooks/` auth, language, theme, cart logic
- `src/integrations/` Supabase client
- `src/pages/` page-level routing fallback

## Screenshots
Place portfolio screenshots in `screenshots/`.
