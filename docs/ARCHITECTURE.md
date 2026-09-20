# Avainpelaaja OS architecture

## Product
StandSales OS is the operational system for stand-sales coordination.

Core flow:

Kauppapaikat → CRM → Neuvottelu → Varaus → Myyjä → Työvuoro → Työaika → Myynti → Raportointi → AI

## Roles
- ADMIN: full organization access
- BOOKER: locations, contacts, CRM and bookings
- MANAGER: sellers, shifts, hours and results
- SELLER: own shifts, time entries and sales
- REPORTING: reports and read-only operational data

## Production rules
1. Organization/tenant scope is mandatory for business data.
2. Every write must be auditable.
3. Calendar writes must validate seller and location conflicts.
4. AI suggestions never silently change bookings or employee data.
5. Personal/location data is minimized and permission controlled.
6. Color status always has text/symbol as a second signal.

## Next implementation layers
1. Prisma client + PostgreSQL migrations
2. Authentication and RBAC
3. API/service layer
4. Calendar conflict engine
5. Persistent CRM and location registry
6. Time tracking and sales
7. Notifications
8. Maps integration
9. Object storage
10. AI service with traceable data sources
