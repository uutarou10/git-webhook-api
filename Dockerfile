FROM node:10
MAINTAINER Kota Nonaka <kota.kaicho@gmail.com>

WORKDIR /app

ADD package.json .
ADD package-lock.json .
RUN npm i

ADD . .

CMD node main.js