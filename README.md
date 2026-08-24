# Studio CRM v2

Modern replacement for the original local CRM. The original application remains in `/Users/andras/Sites/crm` and is the current source of data and backend behavior during migration.

## Foundation

- React 19 and TypeScript
- Tailwind CSS 4
- TanStack Query for API state
- React Hook Form and Zod for validated forms
- Existing Express/MongoDB API, kept local on port 8000
- PM2 process definition for the API

## Local development

Copy `.env.example` to `.env.local`, then run `npm run dev`. The frontend expects the versioned API at `http://localhost:8000/api/v1`; until backend versioning is added, dashboard content is representative fixture data.

Start the current backend with `pm2 start ecosystem.config.cjs` from this directory.

## Phase 1 status

- [x] Separate v2 workspace
- [x] Responsive CRM application shell
- [x] Tailwind design foundation
- [x] Query and API boundary
- [x] Environment template
- [x] PM2 backend definition
- [x] Version and harden the existing API while preserving legacy routes
- [x] Add health check and API validation tests
- [x] Inspect and back up the existing MongoDB data before schema migrations
