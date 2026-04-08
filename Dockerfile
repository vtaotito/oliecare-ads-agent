FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p logs

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 adsagent && \
    chown -R adsagent:nodejs /app/logs

USER adsagent

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "src/server.js"]
