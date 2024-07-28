FROM node:22-alpine AS install

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /usr/src/app

COPY proxy/package.json proxy/package-lock.json ./
RUN npm install --ci

FROM node:22-slim AS serve

WORKDIR /usr/src/app

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# No need to copy lock file as the node_modules directory is separately copied, not installed
COPY proxy/package.json proxy/proxy.js ./
COPY --from=install /usr/src/app/node_modules node_modules/

USER node

RUN npx puppeteer browsers install chrome

CMD [ "npm", "run", "start" ]
