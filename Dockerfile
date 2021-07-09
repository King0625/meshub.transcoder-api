FROM node:12

WORKDIR /usr/app

#RUN apt update
#RUN apt install ffmpeg -y
COPY ./api/package*.json ./
RUN npm install
COPY ./api ./
RUN mv ff* /usr/bin

COPY ./web ./web
WORKDIR /usr/app/web
RUN npm install
RUN npm run build
RUN mkdir -p /var/www/transcoder.meshstream.io/v2
RUN cp -r ./dist/* /var/www/transcoder.meshstream.io/v2

# remember not to add semicolon !!!!!!!
ENV MONGO_URL=mongodb://transcoder-user:mesh1234@allinone.meshub.tv:50128/transcoder

WORKDIR /usr/app
CMD ["npm", "start"]
