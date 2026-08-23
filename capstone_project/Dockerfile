# ==============================================================================
# Ticket Resale Marketplace - Production Dockerfile
# Multi-stage build for Next.js Standalone Application
# Stages: deps -> builder -> runner
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies (deps)
# Installs project dependencies in a clean, isolated layer with cache optimization
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# libc6-compat is needed for alpine compatibility with some native binaries
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manifests for deterministic dependency caching
COPY package.json package-lock.json* ./

# Install clean production and development dependencies needed for building
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Builder
# Copies dependencies & source code, runs Prisma generation, and builds Next.js
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

ARG DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ticket_resale?schema=public"
ARG MONGODB_URI="mongodb://mongo:27017/ticket_resale"
ARG NEXTAUTH_URL="http://localhost:3001"
ARG NEXTAUTH_SECRET="docker-nextauth-secret"

ENV DATABASE_URL=${DATABASE_URL}
ENV MONGODB_URI=${MONGODB_URI}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure public directory exists so downstream COPY commands succeed
RUN mkdir -p public

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full application source code
COPY . .

# Generate Prisma Client if schema exists (safe fallback if not present)
RUN if [ -f ./prisma/schema.prisma ]; then npx prisma generate; else echo "Prisma schema not found, skipping prisma generate"; fi

# Build the Next.js standalone application bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Runner (Production)
# Minimal Alpine image containing only the compiled standalone output and static assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Image metadata labels
LABEL maintainer="Ticket Resale Marketplace Team"
LABEL org.opencontainers.image.title="Ticket Resale Marketplace"
LABEL org.opencontainers.image.description="Production Docker image for Ticket Resale Marketplace Next.js application"
LABEL org.opencontainers.image.version="0.1.0"

WORKDIR /app

# Set runtime environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ticket_resale?schema=public"
ENV MONGODB_URI="mongodb://mongo:27017/ticket_resale"
ENV NEXTAUTH_URL="http://localhost:3001"
ENV NEXTAUTH_SECRET="docker-nextauth-secret"

# Create unprivileged system group and user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static public assets from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Automatically leverage output traces to copy standalone server & required packages
# Output files are created in .next/standalone by Next.js with output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nextjs

# Expose Next.js application port
EXPOSE 3001

# Run the standalone Node.js server
CMD ["node", "server.js"]
