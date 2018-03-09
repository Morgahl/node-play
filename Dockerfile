FROM node:alpine

RUN mkdir -p /user/src/app
WORKDIR /usr/src/app

COPY ./dist /usr/src/app/dist

COPY ./secret /usr/src/app/secret

COPY package.json /usr/src/app/

RUN npm install --production

CMD [ "node", "dist/main.js" ]