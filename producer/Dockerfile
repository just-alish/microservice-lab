# microservice-lab/producer/Dockerfile
# stage 1: deps.
FROM node:20-alpine AS deps
WORKDIR /app
  # copy just the package files first for Docker layer caching.
COPY package*.json ./
RUN npm ci

# stage 2: builder
FROM deps AS builder
WORKDIR /app

COPY . .
RUN npm run build

# stage 3: prod-deps.
FROM deps AS prod-deps
WORKDIR /app
  # removes all devDependencies from the node_modules folder.
RUN npm prune --production

# stage 4: prod.
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
  # copy from 'prod-deps' to get the slim modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
  # run as non-root user for security.
USER node
  # the port the app listens on, Fastify uses '3000'.
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "dist/index.js"]