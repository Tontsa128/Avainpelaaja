# Avainpelaaja OS

Avainpelaaja OS is a multi-tenant operational system for stand-sales coordination: locations, CRM, bookings, sellers, working hours, sales, reporting and AI assistance.

## Current implementation

- Next.js + TypeScript + React
- Tailwind CSS
- Prisma + PostgreSQL data model
- DEMO mode with example data
- TYÖ mode for organization-owned operational data
- Tenant-scoped seller, location and booking APIs
- Booking overlap validation for seller/location
- Audit logging for API writes
- Prisma seed data
- CI build validation with Node 20

## Local setup

1. Install Node.js 20.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` to a PostgreSQL database.
4. Set `DEFAULT_ORGANIZATION_ID` and `NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID` to the organization used by the local workspace.
5. Install packages with `npm install`.
6. Generate Prisma Client with `npm run prisma:generate`.
7. Apply the current schema with `npm run db:push`.
8. Seed the demo organization with `npm run db:seed`.
9. Start with `npm run dev`.

Open `http://localhost:3000`.

## API scope

- `GET/POST /api/sellers`
- `PATCH/DELETE /api/sellers/:id`
- `GET/POST /api/locations`
- `PATCH /api/locations/:id`
- `GET/POST /api/bookings`
- `PATCH/DELETE /api/bookings/:id`
- `GET /api/health`
- `GET /api/health/db`

Business requests must carry `x-organization-id`, unless `DEFAULT_ORGANIZATION_ID` is configured on the server. Authentication/RBAC will replace this development scope mechanism before production deployment.

## Production principles

1. Every business record is organization-scoped.
2. Booking writes validate time overlap.
3. API writes create audit records.
4. Demo data is never treated as real work data.
5. AI suggestions must remain reviewable and must not silently modify operational records.
6. Status is represented by text/symbol in addition to color.
