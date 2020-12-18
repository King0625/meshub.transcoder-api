FROM node:12

WORKDIR /usr/app

#RUN apt update
#RUN apt install ffmpeg -y
COPY ./package*.json ./
RUN npm install
COPY ./ ./
RUN mv ff* /usr/bin

# remember not to add semicolon !!!!!!!
ENV MONGO_URL=mongodb://mesh-admin:mesh1234@allinone.meshub.tv:50128/webrtc-admin

CMD ["npm", "start"]
