FROM node:20-alpine

WORKDIR /app

COPY server/package.json ./
RUN npm install --omit=dev

COPY server/server.js ./
COPY site ./site

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV SITE_DIR=/app/site
ENV PORT=8080

EXPOSE 8080
VOLUME ["/data"]

CMD ["node", "server.js"]
