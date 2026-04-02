FROM node:24-alpine

WORKDIR /app

COPY package-lock.json package.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "server.js" ]