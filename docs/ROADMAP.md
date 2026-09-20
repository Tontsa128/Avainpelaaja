# Avainpelaaja OS roadmap

## Phase 1 — Foundation
- [x] Next.js application shell
- [x] Responsive navigation
- [x] Working menu on mobile
- [x] Dashboard
- [x] Calendar UI
- [x] CRM UI
- [x] Seller/location modules
- [x] Sales/hours/reports/AI/documents/settings views
- [x] Functional create dialogs
- [x] Prisma data model

## Phase 2 — Real data
- [x] PostgreSQL connection configuration
- [ ] Prisma migrations (run against production database)
- [x] Seed organization and demo data
- [x] Shared Prisma client
- [x] Tenant-scoped CRUD API for sellers, locations and bookings
- [x] Booking conflict validation
- [x] Audit write service
- [ ] Real dashboard KPIs wired to API

## Phase 3 — Security
- [ ] Authentication
- [ ] RBAC
- [x] Organization isolation at API boundary
- [x] Audit log service
- [ ] Rate limiting
- [ ] Security headers
- [ ] Backup/restore policy

## Phase 4 — Operations
- [ ] Calendar drag/drop
- [ ] Conflict engine
- [ ] Shift lifecycle
- [ ] Mobile time clock
- [ ] Sales entry
- [ ] CRM call logging
- [ ] Notifications

## Phase 5 — Intelligence
- [ ] AI action center
- [ ] Voice notes
- [ ] Location analytics
- [ ] Seller/location fit analysis
- [ ] Booking suggestions
- [ ] Forecasting with sufficient historical data

## Phase 6 — Integrations
- [ ] Google Maps or Mapbox
- [ ] Email
- [ ] Calendar exports
- [ ] Document storage
- [ ] Excel/CSV/PDF exports
