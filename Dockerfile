# Multi-stage Dockerfile intended to minimize production image size
# Based on https://blog.hasura.io/an-exhaustive-guide-to-writing-dockerfiles-for-node-js-web-apps-bbee6bd2f3c4

# Base node image
FROM node:carbon@sha256:89171382ea2e08a7ca84f653cd37e30e47b9c305baaee272899e25c912172f26 AS base
WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package.json ./
COPY package-lock.json ./
COPY .babelrc ./
RUN npm install

# Copy files and build
FROM dependencies AS build
WORKDIR /app
COPY server /app/server
RUN npm run build

# Release with Alpine
FROM node:alpine@sha256:3b0e27010a4b643cc67154381f0f8df74d9aa0d048222f0442428faefa248372 AS release
WORKDIR /app
COPY --from=dependencies /app/package.json ./
RUN npm install --only=production
COPY --from=build /app ./
CMD ["npm", "start"]
