# Studio CRM v2

Modern replacement for the original local CRM. The original application remains in `/Users/andras/Sites/crm` and is the current source of data and backend behavior during migration.

## Foundation

- React 19 and TypeScript
- Tailwind CSS 4
- TanStack Query for API state
- React Hook Form and Zod for validated forms
- Express/MongoDB API hosted on Railway, with a local development server on port 8000
- PM2 process definition for the API

## Local development

The frontend and backend are separate projects:

- Frontend: `/Users/andras/Sites/crm-v2`
- Backend: `/Users/andras/Sites/crm/crm-backend`

### 1. Point the frontend at the local backend

Open `/Users/andras/Sites/crm-v2/.env.local`. It must contain only one
`NEXT_PUBLIC_API_URL` entry. For local testing, set it to:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Do not add a second `NEXT_PUBLIC_API_URL` line. Restart the frontend whenever
this value changes.

### 2. Start or restart the backend with PM2

From the frontend directory, the included PM2 configuration starts the backend
as `crm-api`:

```bash
cd /Users/andras/Sites/crm-v2
pm2 start ecosystem.config.cjs
```

If it is already registered with PM2, restart it after backend code changes:

```bash
pm2 restart crm-api
```

Check that the API and database are healthy:

```bash
curl http://localhost:8000/health
```

The response should contain `"status":"ok"` and `"database":"connected"`.

Useful PM2 commands:

```bash
pm2 list
pm2 logs crm --lines 100
```

### 3. Start the frontend

In a separate Terminal window:

```bash
cd /Users/andras/Sites/crm-v2
npm run dev
```

Open the URL printed in the Terminal, normally `http://localhost:3000`. Stop
the frontend with `Ctrl+C` when testing is finished.

### 4. Return local development to the production API

If you want the local frontend to use Railway again, change the existing line
in `.env.local` back to:

```env
NEXT_PUBLIC_API_URL=https://studio-crm-api-production.up.railway.app/api/v1
```

Then restart `npm run dev`.

### Troubleshooting

- `nodejs_compat` must be declared only in `wrangler.jsonc`, not duplicated in
  `vite.config.ts`.
- The `punycode` deprecation and experimental `glob` messages are warnings and
  do not normally stop the development server.
- If port 3000 is occupied, use the alternative URL printed by Vinext.
- If the UI reports that the API cannot be reached, check `pm2 list`, the
  `/health` response, and the single URL in `.env.local`.

## Production hosting

- Frontend owner: the Cloudflare account for `a.vargyas@icloud.com`
- Cloudflare Pages project: `studio-crm`
- Cloudflare Pages URL: `https://studio-crm-2uq.pages.dev`
- Primary public URL: `https://crm.webtechsupport.co.uk` (Cloudflare Pages custom domain; SSL enabled)
- Backend API: `https://studio-crm-api-production.up.railway.app/api/v1`
- DNS remains at Namecheap. Only the `crm` CNAME record is used for the frontend; the domain nameservers must not be changed.
- Frontend deployment: commit and push `crm-v2` to `main` → automatic Cloudflare Pages deployment
- Backend deployment: commit and push `crm-backend` to `main` → automatic Railway deployment
- Review and test changes before committing; local changes are not deployed until they are committed and pushed.

Namecheap DNS record:

- Type: `CNAME`
- Host: `crm`
- Target: `studio-crm-2uq.pages.dev`

Railway's `CORS_ORIGINS` must include both
`https://crm.webtechsupport.co.uk` and `https://studio-crm-2uq.pages.dev`.

Cloudflare Pages builds are prepared in `dist/pages`, including the Vinext
server runtime as an advanced Pages Function. Normal production releases use
the GitHub workflow; `npm run deploy:pages` is available only when a manual
frontend deployment is intentionally required.

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
