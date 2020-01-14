FROM node:lts-alpine3.11

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install

COPY tsconfig.json src ./

CMD [ "yarn", "serve:prod" ]
