FROM node:22-alpine AS install

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /usr/src/app

COPY proxy/package.json proxy/package-lock.json ./
RUN npm install --ci

FROM node:22-slim AS serve

WORKDIR /usr/src/app

RUN apt-get update \
    && apt-get install -y \
      curl \
      firefox-esr # Need to use ESR as there is no stable version of Firefox for Debian

USER node

# No need to copy lock file as the node_modules directory is separately copied, not installed
COPY proxy/package.json proxy/proxy.js ./
COPY --from=install /usr/src/app/node_modules node_modules/

CMD [ "npm", "run", "start" ]
