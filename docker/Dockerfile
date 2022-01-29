FROM node:16-alpine AS build

WORKDIR /usr/src/app

COPY package.json yarn.lock decorate-angular-cli.js ./
RUN yarn install --frozen-lockfile --network-timeout 60000

COPY angular.json nest-cli.json nx.json tsconfig.base.json ./

COPY apps apps/
COPY libs libs/

RUN yarn ng build api --prod
RUN yarn ng build frontend --prod

FROM node:16-alpine AS serve
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist dist/
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true --network-timeout 60000 && yarn cache clean

CMD [ "yarn", "start:api" ]
