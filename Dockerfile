FROM node:24.14.1-alpine3.22

WORKDIR /app

COPY package-lock.json package.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "server.js" ]