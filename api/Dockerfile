FROM node:12-alpine

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY ./ ./

# This url will be changed to remote mongodb server
ENV MONGO_URL="mongodb://127.0.0.1:27017/torii-meshub-v2";

CMD ["npm", "start"]