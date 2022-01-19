FROM node:12

WORKDIR /usr/app

RUN apt update
RUN apt install -y vim curl

ENV TZ=Asia/Taipei
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY ./api/package*.json ./
RUN npm install
COPY ./api ./
RUN mv ff* /usr/bin

CMD ["npm", "start"]
