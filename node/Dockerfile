FROM node:14

WORKDIR /usr/src/app
RUN chown -R node:node /usr/src/app
USER node

COPY ./node/package*.json ./

RUN npm install

COPY . .

EXPOSE 3000
CMD [ "node", "app.js" ]