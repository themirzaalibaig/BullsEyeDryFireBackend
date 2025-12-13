# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (production + dev for Prisma generation)
# Skip scripts since Prisma Client will be generated in builder stage with source code
RUN pnpm install --frozen-lockfile --ignore-scripts

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source code and config files
COPY . .

# Generate Prisma Client
# Set dummy DATABASE_URL for build (Prisma Client generation doesn't need a real connection)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN pnpm prisma generate

# Build TypeScript and resolve path aliases
RUN pnpm exec tsc && pnpm exec tsc-alias

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

# Install pnpm and openssl for Prisma
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate && \
    apk add --no-cache openssl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies (skip scripts since Prisma Client is already generated)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    pnpm store prune

# Copy built application and Prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/src/prisma ./src/prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "dist/src/server.js"]
