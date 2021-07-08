FROM node:12

WORKDIR /usr/app

#RUN apt update
#RUN apt install ffmpeg -y
COPY ./package*.json ./
RUN npm install
COPY ./ ./
RUN mv ff* /usr/bin

# remember not to add semicolon !!!!!!!
ENV MONGO_URL=mongodb://transcoder-user:mesh1234@allinone.meshub.tv:50128/transcoder

CMD ["npm", "start"]
