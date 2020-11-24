FROM node:12-alpine

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY ./ ./

ENV MONGO_URL="mongodb://mesh-admin:mesh1234@allinone.meshub.tv:51024/admin?authSource=admin";

CMD ["npm", "start"]