FROM node:19-alpine3.15

WORKDIR /app
COPY . .

RUN npm i --force

EXPOSE 1337
ENTRYPOINT [ "node", "index.js" ]
