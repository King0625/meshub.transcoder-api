FROM node:12-alpine

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY ./ ./

ENV MONGO_URL="mongodb://meshub:qazwsx@torii-demo.meshub.io:27017/torii-meshub-v2";

CMD ["npm", "start"]