# Use node:18-bookworm-slim for a smaller image file
FROM node:18-bookworm-slim

ARG COMMIT_HASH

WORKDIR /usr/src/app/lib
COPY lib/schema ./schema
COPY lib/src ./src
COPY lib/package* ./
COPY lib/tsconfig.json ./
COPY lib/.env ./
COPY lib/rollup.config.js ./
RUN npm install

WORKDIR /usr/src/app/samples/server-backend
COPY samples/client-side-html ../client-side-html
COPY samples/server-backend/src ./src
COPY samples/server-backend/public ./public
COPY samples/server-backend/package* ./
COPY samples/server-backend/tsconfig.json ./
COPY samples/server-backend/.env ./
RUN npm install
RUN npm run build

CMD [ "node", "dist/server.js" ]

EXPOSE 4000
