# HardenHub

E-commerce platform for **security hardening guides and standards** (CIS Benchmarks, DISA STIG, NIST) with per-customer customization and a real **document-generation engine** (DOCX / PDF / XLSX).

Built from the FRD (v0.1) and the `HardenHub.dc.html` design. This is the **MVP (Phase 1)** vertical slice, implemented as a Next.js app with a working generation backend.

> Branding follows the design file (**HardenHub**). Package/DB name is `controlforge` — trivial to rename.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Data | Prisma + SQLite (`prisma/schema.prisma` maps §9 of the FRD) |
| UI | React + ported design system (`src/lib/hub/theme.ts` `css()` helper) |
| Generation | `docx` · `pdf-lib` · `exceljs` |
| Payments | Stripe-ready (stub checkout in the UI) |

## Quick start

```bash
npm install
cp .env.example .env
npm run db:push      # create SQLite schema
npm run db:seed      # seed frameworks, controls, mappings, products, coupon, demo org
npm run dev          # http://localhost:3000
```

## What's implemented

**Storefront / customer portal** — the whole SPA from the design, 13 views:
Storefront (hero, family selector, bundle grid, directory) · Product (stats, cross-mappings, watermarked preview, buy box) · Cart (coupon `HARDEN25`, VAT) · Checkout (billing, Stripe/PO) · **Scope Wizard** (6 steps: org details → branding → technical scope → include/exclude with justification → ODP parameters → review & generate) · Library · Licenses.

**Back office** — Dashboard (KPIs) · AI Standard Generator (ingest simulation + reconciliation) · Control editor · Catalog & pricing · Orders · Versioning diff.

**Generation engine (real)** — `POST /api/generate` combines Product + Scope + Branding + ODP into:
- **DOCX** — cover page (branded), executive summary, applicability matrix, per-control sections.
- **PDF** — same, with a diagonal watermark + license ID footer on every page (`pdf-lib`).
- **XLSX** — summary sheet + filterable control matrix (`exceljs`).

Each artifact embeds a **license ID**, records a verifiable **sha256 hash** (FR-G-03), substitutes **ODP values** into remediation text (e.g. min password length), and reflects **included/excluded controls with justifications**. Download via `GET /api/artifact/<file>` (path-traversal guarded; production would use signed object-storage URLs).

### Content licensing (§11)
Seed content is **original text that maps** to the CIS benchmark structure — never verbatim. Each `Framework` carries a `reproductionMode` (`VERBATIM_OK` for public-domain NIST/DISA-STIG, `MAP_ONLY` for copyrighted CIS/ISO/PCI) so the engine can enforce reproduction policy.

## Project layout

```
prisma/schema.prisma        # data model (§9)
prisma/seed.ts              # demo catalog
src/lib/hub/                # data.ts, store.tsx (state), theme.ts (css helper), controlContent.ts
src/lib/generate.ts         # DOCX/PDF/XLSX generation engine
src/components/hub/          # TopBar, Sidebar, Icon
src/components/hub/views/    # 13 view components
src/app/api/generate         # generation endpoint
src/app/api/artifact/[name]  # artifact download
```

## Verification

`scripts/shot.mjs` drives the pre-installed Chromium to screenshot each view. Generation is smoke-tested end-to-end: all three formats produce valid Office/PDF files with correct MIME types, hashes, ODP substitution, and applicability matrix.

## Not yet wired (Phase 2/3)
Real Stripe charge + webhooks, auth/MFA login flow, DB-backed cart/orders, XCCDF/OSCAL importers, subscription notifications, e-signature. The data model and audit log already accommodate them.
