# microservice-lab/consumer/Dockerfile
# stage 1: deps.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# stage 2: builder.
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# stage 3: prod-deps.
FROM deps AS prod-deps
WORKDIR /app
RUN npm prune --production

# stage 4: prod.
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

USER node
  # no port exposed: consumer is a worker, not a web server.
CMD ["node", "dist/index.js"]