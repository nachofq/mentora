FROM node:22.12-alpine 

WORKDIR /app

COPY package*.json ./

RUN yarn install 

COPY . .

EXPOSE 3000