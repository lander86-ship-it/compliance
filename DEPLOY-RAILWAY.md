# Deploying SecureHub to Railway

SecureHub ships as a single **Docker image** (Node + Python `cis-bench`) and uses
**PostgreSQL** for persistence. Generation is live — DISA works with no credentials;
CIS needs your CIS WorkBench session.

## One-time setup (≈3 minutes)

1. **Create the project** — [railway.app](https://railway.app) → **New Project** →
   **Deploy from GitHub repo** → pick `lander86-ship-it/compliance` and the branch
   `claude/hardening-guides-ecommerce-p83y1v` (or `main` once merged).
   Railway detects `railway.json` and builds the `Dockerfile`.

2. **Add PostgreSQL** — in the project, **New** → **Database** → **PostgreSQL**.
   Railway automatically injects `DATABASE_URL` into the app service. No further DB
   config is needed; the container runs `prisma db push` on boot to create the schema.

3. **Set environment variables** on the app service (**Variables** tab):

   | Variable | Required | Value |
   |---|---|---|
   | `SESSION_SECRET` | ✅ | a long random string (session cookie signing) |
   | `OWNER_EMAILS` | ✅ | your email(s), comma-separated → provisioned as **admin/owner** |
   | `APP_BASE_URL` | recommended | your Railway public URL, e.g. `https://securehub.up.railway.app` |
   | `ANTHROPIC_API_KEY` | optional | enables AI-drafted policy narrative (static fallback otherwise) |
   | `CIS_COOKIES_B64` | optional | base64 of a CIS WorkBench `cookies.txt` — enables the **CIS** source (DISA works without it) |

   `DATABASE_URL` and `PORT` are provided by Railway — do not set them yourself.

4. **Deploy** — Railway builds and starts the image. The healthcheck hits
   `/api/health`; once green, open the generated domain.

5. **Sign up with your `OWNER_EMAILS` address** → you land in the Back Office
   (admin). Any other signup is a customer.

## Enabling the CIS source

The CIS half connects to CIS WorkBench through the bundled `cis-bench` CLI, using
your organisation's CIS SecureSuite session (same mechanism as the /cis service).
Export your WorkBench cookies to a Netscape `cookies.txt`, then:

```bash
base64 -w0 cookies.txt   # copy the output into the CIS_COOKIES_B64 variable
```

On boot the container logs in headlessly; the Generator's CIS source turns from
"connect your CIS WorkBench" to live. DISA needs none of this.

## Notes

- **Generated files** (`/storage`) are ephemeral. To keep them across redeploys,
  attach a Railway **Volume** mounted at `/app/storage` (optional — the documents
  are also re-generatable on demand).
- **Schema changes**: the container uses `prisma db push` (additive, safe). For
  destructive migrations on real data, switch to committed Prisma migrations
  (`prisma migrate deploy`).
- **Local dev**: `DATABASE_URL=postgres://…` + `npm run db:push && npm run dev`.
