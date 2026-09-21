# ---- stage 1: build the frontend (React + JSX -> one static app.js) ----
FROM node:20-alpine AS client-build
WORKDIR /client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/src ./src
COPY client/build.mjs ./
RUN npm run build

# ---- stage 2: runtime ----
FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/server.js ./
COPY site ./site
COPY --from=client-build /site/app.js ./site/app.js
COPY --from=client-build /site/app.js.map ./site/app.js.map

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV SITE_DIR=/app/site
ENV PORT=8080

EXPOSE 8080
VOLUME ["/data"]

CMD ["node", "server.js"]
