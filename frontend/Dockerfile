FROM node:24-alpine3.22 AS build

WORKDIR /app

COPY package-lock.json package.json ./
RUN npm install

COPY . .

ENV VITE_API_BASE="/api"
ENV VITE_BUCKET_URL="http://localhost:9000/testpublic/"

RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

