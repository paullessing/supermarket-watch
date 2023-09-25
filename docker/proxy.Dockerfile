FROM node:18-alpine AS install

WORKDIR /usr/src/app

COPY proxy/package.json proxy/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 60000 --cache-folder .yarn-cache

FROM node:16-alpine AS serve
WORKDIR /usr/src/app

# No need to copy yarn.lock as the node_modules directory is separately copied, not installed
COPY proxy/package.json proxy/proxy.js ./
COPY --from=install /usr/src/app/node_modules node_modules/

CMD [ "yarn", "start" ]
