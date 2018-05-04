# Multi-stage Dockerfile intended to minimize production image size
# Based on https://blog.hasura.io/an-exhaustive-guide-to-writing-dockerfiles-for-node-js-web-apps-bbee6bd2f3c4

# Base node image
FROM node:carbon AS base
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
COPY bin/_run-docker /app/bin/_run-docker
RUN npm run build

# Release with Alpine
FROM node:alpine AS release
# slightly annoying: no bash by default...
RUN apk add --update bash && rm -rf /var/cache/apk/*
WORKDIR /app
COPY --from=dependencies /app/package.json ./
RUN npm install --only=production
COPY --from=build /app ./
RUN cd /app  
CMD /app/bin/_run-docker
