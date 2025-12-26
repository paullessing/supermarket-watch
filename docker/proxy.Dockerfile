FROM node:24-alpine AS install

WORKDIR /usr/src/app

RUN apk update && apk add \
    curl \
    ca-certificates

# Install curl-impersonate from GitHub releases
RUN curl -L -o curl-impersonate.tar.gz https://github.com/lexiforest/curl-impersonate/releases/download/v1.2.5/curl-impersonate-v1.2.5.x86_64-linux-gnu.tar.gz \
        && mkdir curl-impersonate \
        && tar -xzf curl-impersonate.tar.gz -C curl-impersonate

COPY proxy/package.json proxy/package-lock.json ./
RUN npm ci


FROM node:24-slim AS serve

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    zlib1g-dev \
    ca-certificates \
    gnupg \
    libnss3 \
    nss-plugin-pem \
    && rm -rf /var/lib/apt/lists/*

USER node

# No need to copy lock file as the node_modules directory is separately copied, not installed
COPY proxy/package.json proxy/proxy.js ./
COPY --from=install /usr/src/app/node_modules node_modules/
COPY --from=install /usr/src/app/curl-impersonate/ /usr/local/bin/

CMD [ "npm", "run", "start" ]
