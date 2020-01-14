FROM node:lts-alpine3.11

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
COPY frontend/package.json frontend/yarn.lock ./frontend/
RUN yarn install

COPY tsconfig.json ./
COPY src ./src
COPY frontend ./frontend

RUN yarn build

CMD [ "yarn", "start" ]
