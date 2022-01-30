FROM node:16-alpine AS build

WORKDIR /usr/src/app

COPY package.json yarn.lock decorate-angular-cli.js ./
RUN yarn install --frozen-lockfile --network-timeout 60000 --cache-folder .yarn-cache

COPY angular.json nest-cli.json nx.json tsconfig.base.json ./

COPY apps apps/
COPY libs libs/

RUN yarn nx run-many --target=build --configuration=production --projects=api,frontend


# Running `yarn install --production` separately allows us to reuse the `.yarn-cache` without bloating the main image
# We copy the production node_modules directory over to the `serve` image later, saving ourselves the slow `yarn install` step
FROM node:16-alpine AS install
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
COPY --from=build /usr/src/app/.yarn-cache .yarn-cache/
RUN yarn install --frozen-lockfile --production=true --network-timeout 60000 --cache-folder .yarn-cache


FROM node:16-alpine AS serve
WORKDIR /usr/src/app

# No need to copy yarn.lock as the node_modules directory is separately copied, not installed
COPY package.json ./
COPY --from=build /usr/src/app/dist dist/
COPY --from=install /usr/src/app/node_modules node_modules/

CMD [ "yarn", "start:api" ]
