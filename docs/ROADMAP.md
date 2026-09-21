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


## Master-suunnitelman integraatio – 2026-09-21

Tätä tiekarttaa täydennetään projektin mukana toimitetun **Avainpelaaja OS – Master-suunnitelma v1.0** -asiakirjan perusteella. Master-suunnitelman 12 vaihetta säilyvät pitkän aikavälin tavoitearkkitehtuurina, mutta toteutus tehdään kontrolloidusti niin, että jokainen vaihe toimii ennen seuraavan päälle rakentamista.

### Nyt toteutettu CRM-perusta

- Pysyvä CRM Opportunity -tietomalli
- Tyypitetyt CRM-vaiheet
- Seuraava toimenpide + määräaika
- Kauppapaikka-, yhteyshenkilö- ja vastuuhenkilölinkitykset
- CRM-aktiviteetit: puhelu, sähköposti, muistiinpano, tapaaminen, tarjous ja tilamuutos
- Tenant-scope kaikissa CRM-kyselyissä
- Audit-loki CRM-kirjoituksille
- Contact API
- CRM Opportunity API
- CRM Activity API
- Frontendin typed client API -rajapinnat

### Seuraava tekninen työjärjestys

1. Auth + RBAC ja käyttäjän todellinen organisaatiojäsenyys
2. CRM:n käyttöliittymän kytkentä pysyvään API-dataan
3. Kalenterin työvuoromalli ja konfliktimoottorin laajennus
4. Työajanseurannan API ja mobiilin leimaus
5. Myyntikirjaukset ja tavoitelaskenta
6. Dashboardin oikeat aggregaatiot
7. Kartta + PostGIS-valmius
8. Dokumentit ja turvallinen objektitallennus
9. Raportointi ja vientikerros
10. AI Action Center, RAG ja puheesta rakenteiseksi CRM-dataksi
11. Taloushallinnon integraatiot
12. Multi-tenant SaaS -tuotteistus
