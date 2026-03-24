# Privat OSINT

Private OSINT workbench for lawful company research, access-controlled investigations, B2B signal discovery, and analyst dossiers.

## Features

- Matrix-style login screen and access request intake
- Seeded admin account with approval and rejection workflow
- Admin cabinet for user creation, quotas, expiry windows, and audit visibility
- Unified search console with live public connectors and curated next-source recommendations
- Source library covering registry, sanctions, code intelligence, and technical footprint tools
- Personal dossier storage for saved investigation snapshots

## Stack

- Next.js 16
- React 19
- Tailwind 4
- Prisma Client for data access
- SQLite storage bootstrapped through `prisma/init.sql`

## Quick Start

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Admin Login

- Login: `Mentor`
- Password: `Mentor07@`

You can override these defaults in `.env`.

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
- Built-in live search currently uses official GitHub search and official GLEIF registry search.
- The rest of the OSINT stack is represented as a connector catalog and staged integration surface for later expansion.
- `postinstall` repairs two broken registry packages in this environment before generating Prisma Client.
