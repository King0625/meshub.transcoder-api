FROM node:12-alpine

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY ./ ./

# remember not to add semicolon !!!!!!!
ENV MONGO_URL=mongodb://transcoder-user:mesh1234@allinone.meshub.tv:50128/transcoder

CMD ["npm", "start"]