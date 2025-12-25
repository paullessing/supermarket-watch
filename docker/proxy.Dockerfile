FROM node:22-alpine AS install

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /usr/src/app

COPY proxy/package.json proxy/package-lock.json ./
RUN npm install --ci

FROM node:22-slim AS serve

WORKDIR /usr/src/app

RUN apt-get update \
    && apt-get install -y \
      cron \
      curl \
      firefox-esr # Need to use ESR as there is no stable version of Firefox for Debian

USER node

# Add a cronjob to delete files from /tmp that start with "Temp" or "puppeteer" to avoid puppeteer spamming the tmp directory with profile and temp directories
RUN (crontab -l 2>/dev/null; echo "0 3 * * * find /tmp -maxdepth 1 -type d \\( -name 'Temp-*' -o -name 'puppeteer_dev_*' \\) -mtime +10 -exec rm -rf {} +") | crontab -

# No need to copy lock file as the node_modules directory is separately copied, not installed
COPY proxy/package.json proxy/proxy.js ./
COPY --from=install /usr/src/app/node_modules node_modules/

CMD [ "npm", "run", "start" ]
