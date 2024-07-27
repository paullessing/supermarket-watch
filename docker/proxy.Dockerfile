FROM node:22-alpine AS install

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /usr/src/app

COPY proxy/package.json proxy/package-lock.json ./
RUN npm install --ci

FROM satantime/puppeteer-node:22.4.1-bullseye-slim AS serve

WORKDIR /usr/src/app
USER node

# No need to copy lock file as the node_modules directory is separately copied, not installed
COPY proxy/package.json proxy/proxy.js ./
COPY --from=install /usr/src/app/node_modules node_modules/

RUN npx puppeteer browsers install chrome

CMD [ "npm", "run", "start" ]
