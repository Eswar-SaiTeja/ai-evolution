FROM node:24

WORKDIR /usr/src/app

# Install dependencies first
COPY package*.json tsconfig.json ./
RUN npm install

# Copy source code and Prisma schema
COPY prisma ./prisma/
COPY src ./src/

# Generate prisma client and compile typescript code
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npx tsc

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Boot database and start API server
CMD ["node", "dist/index.js"]
