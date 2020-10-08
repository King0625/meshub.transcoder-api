FROM mongo:3.6.20-xenial

COPY ./init-mongo.sh /docker-entrypoint-initdb.d/
RUN mkdir -p /home/mongodb
RUN touch /home/mongodb/.dbshell
RUN chown -R mongodb:mongodb /home/mongodb