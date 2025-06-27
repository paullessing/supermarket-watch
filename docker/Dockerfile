FROM node:22.16.0-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --cache .npm

COPY svelte.config.js vite.config.ts ./

COPY src src/
COPY static static/

RUN npm run build

# Running the prod install separately speeds up the process because we can reuse the cache
# while only installing the prod dependencies, and then copy over the whole node_modules
FROM node:22.16.0-alpine AS install
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY --from=build /usr/src/app/.npm .npm/
RUN NODE_ENV=production npm ci --omit=dev --cache .npm


FROM node:22.16.0-alpine AS serve
WORKDIR /usr/src/app

# No need to copy package-lock.json as the node_modules directory is separately copied, not installed
COPY package.json ./
COPY --from=build /usr/src/app/build server/
COPY --from=install /usr/src/app/node_modules node_modules/

CMD [ "node", "server" ]
