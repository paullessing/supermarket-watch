FROM node:12-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install

COPY . ./

RUN yarn ng build api --prod

CMD [ "yarn", "start:dev" ]
