# Privat OSINT

Private OSINT workbench for lawful company research, access-controlled investigations, B2B signal discovery, and analyst dossiers.

## Features

- Matrix-style login screen and access request intake
- Seeded admin account with approval and rejection workflow
- Admin cabinet for user creation, quotas, expiry windows, and audit visibility
- Unified search console with live public connectors for company, domain, username, person, email, and phone pivots
- Native live search for Wikipedia, Wikidata, SEC, GLEIF, GitHub, Wayback, Common Crawl, RDAP, DNS, certificate transparency, HTTP headers, structured data, crawl surface, SEO metadata, and security.txt
- Source library covering registry, sanctions, code intelligence, and technical footprint tools
- Personal dossier storage for saved investigation snapshots
- RU / EN language switcher
- Deploy-ready heavy worker for Sherlock, Maigret, theHarvester, Subfinder, Amass, and optional PhoneInfoga / Octosuite

## Stack

- Next.js 16
- React 19
- Tailwind 4
- Prisma Client for data access
- Managed PostgreSQL via `DATABASE_URL`

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Admin Login

- Login: `Mentor`
- Password: `Mentor07@`

You can override these defaults in `.env`.

## Database

Set `DATABASE_URL` to a PostgreSQL connection string before running:

```bash
npm run db:push
npm run db:seed
```

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:push
npm run db:seed
```

## Notes

- This project is intentionally limited to lawful public-source intelligence.
- Built-in live search now covers registry, GitHub, Wikidata, email/domain pivots, archives including Wayback and Common Crawl, DNS, certificate transparency, SEO metadata, and phone normalization.
- Built-in live search now also covers Wikipedia summaries, HTTP headers, crawl-surface discovery, and JSON-LD / schema.org extraction from target websites.
- Official keyed connectors are supported for Crunchbase, Companies House, and OpenCorporates.
- Heavy tools are meant to run through the self-hosted worker in [workers/heavy-osint](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/README.md), not inside Vercel request-time.
- Ready-to-use deploy manifests for the heavy worker are included for `Fly.io`, `Render`, and `Railway`.
- External-host requirements and tradeoffs are summarized in [DEPLOYMENT_OPTIONS_2026-03-25.md](/Users/dp/Desktop/Osint/privat-osint/workers/heavy-osint/DEPLOYMENT_OPTIONS_2026-03-25.md).
- `postinstall` repairs two broken registry packages in this environment before generating Prisma Client.
- The first request to `/login` also ensures the seed admin exists if the database is empty.
