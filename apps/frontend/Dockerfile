FROM node:22.12-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g pnpm@latest-10

RUN pnpm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["next", "start", "-p", "3001"]
