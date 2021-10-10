FROM node:14-alpine as base

WORKDIR /

COPY package*.json /

FROM base as dev

ENV NODE_ENV=development

RUN npm install

COPY . /

CMD ["node", "rpc_server.js"]