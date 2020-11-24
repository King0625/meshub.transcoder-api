FROM node:12-alpine

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY ./ ./

ENV MONGO_URL="mongodb://allinone.meshub.tv:50128/webrtc-admin";
ENV MONGO_USER="mesh-admin";
ENV MONGO_PWD="mesh1234"

CMD ["npm", "start"]