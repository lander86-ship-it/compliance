# syntax=docker/dockerfile:1
###############################################################################
# SecureHub — Next.js app + embedded cis-bench engine (connects to CIS/DISA)  #
# Polyglot image: Node runs the web app; the Python `cis-bench` CLI provides   #
# the live CIS WorkBench connection, exactly as the /cis service does.          #
###############################################################################

# ---- Stage 1: build the Next.js app with Node ----
FROM node:20-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime with Node + Python + cis-bench ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CIS_WORK_DIR=/work \
    HOME=/data
WORKDIR /app

# Python 3 + the shared libs cis-bench/lxml need. --break-system-packages is
# required on Debian 12's externally-managed Python; this is a single-purpose image.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates libxml2 libxslt1.1 \
 && (pip3 install --no-cache-dir --break-system-packages "cis-bench==0.5.2" \
     || echo "WARN: cis-bench could not be installed — the CIS source is disabled; DISA still works.") \
 && apt-get purge -y python3-pip && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /data/.cis-bench /work

# App: production node_modules + built output.
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/data ./data
COPY --from=build /app/next.config.mjs ./next.config.mjs

# Generate the Prisma client for the runtime image (schema is now present).
RUN npx prisma generate
RUN cis-bench --version || true

EXPOSE 3000
# Bind to $PORT (Railway/Render/Fly set it); default 3000. Sync the Postgres schema
# (additive, best-effort) then start Next. DATABASE_URL is provided by the Railway
# Postgres plugin; cis-bench auth bootstraps from CIS_COOKIES_B64 if set.
CMD ["sh", "-c", "npx prisma db push --skip-generate || true; npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
