FROM ubuntu:20.04
USER root

WORKDIR /usr/app

RUN apt update; apt install -y curl vim apt-transport-https wget ca-certificates gnupg software-properties-common

RUN wget https://deb.nodesource.com/setup_16.x && chmod +x ./setup_16.x && ./setup_16.x

RUN add-apt-repository ppa:team-xbmc/ppa -y && apt update \
    && apt install -y nodejs build-essential

ENV TZ=Asia/Taipei
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY ./api/package*.json ./
RUN npm install
COPY ./api ./
RUN mv ff* /usr/bin

CMD ["npm", "start"]
