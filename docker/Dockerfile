FROM node:12-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock decorate-angular-cli.js ./
RUN yarn install

COPY angular.json nest-cli.json nx.json tsconfig.base.json ./

COPY apps apps/
COPY libs libs/

RUN yarn ng build api --prod
RUN yarn ng build frontend --prod

CMD [ "yarn", "start:api" ]
