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

Set `NEXT_PUBLIC_API_URL` in `.env.local`. Production-backed local development uses `https://studio-crm-api-production.up.railway.app/api/v1`.

Start the current backend with `pm2 start ecosystem.config.cjs` from this directory.

## Production hosting

- Frontend owner: the Cloudflare account for `a.vargyas@icloud.com`
- Cloudflare Pages project: `studio-crm`
- Cloudflare Pages URL: `https://studio-crm-2uq.pages.dev`
- Primary public URL: `https://crm.webtechsupport.co.uk` (Cloudflare Pages custom domain; SSL enabled)
- Backend API: `https://studio-crm-api-production.up.railway.app/api/v1`
- DNS remains at Namecheap. Only the `crm` CNAME record is used for the frontend; the domain nameservers must not be changed.

Namecheap DNS record:

- Type: `CNAME`
- Host: `crm`
- Target: `studio-crm-2uq.pages.dev`

Railway's `CORS_ORIGINS` must include both
`https://crm.webtechsupport.co.uk` and `https://studio-crm-2uq.pages.dev`.

Deploy the current frontend with `npm run deploy:pages`. Cloudflare Pages builds
are prepared in `dist/pages`, including the vinext server runtime as an advanced
Pages Function.

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
