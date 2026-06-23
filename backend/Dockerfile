FROM oven/bun:1-alpine as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Generate Prisma Client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3002

# Server start command
CMD ["bun", "src/index.ts"]
