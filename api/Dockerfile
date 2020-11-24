FROM node:12-alpine

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY ./ ./

# remember not to add semicolon !!!!!!!
ENV MONGO_URL="mongodb://mesh-admin:mesh1234@allinone.meshub.tv:50128/webrtc-admin"

CMD ["npm", "start"]