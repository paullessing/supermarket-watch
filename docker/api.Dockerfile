FROM node:12-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install

COPY angular.json nest-cli.json nx.json tsconfig.json ./

COPY apps apps/
COPY libs libs/

RUN yarn ng build api --prod
RUN yarn ng build frontend --prod

CMD [ "yarn", "start:api" ]
