# syntax=docker/dockerfile:1

FROM node:14.15.3
ENV NODE_ENV=production
WORKDIR /app

COPY ["package.json", "./"]
RUN npm install --production
COPY . .
#RUN export DOCKER_HOST_IP=$(route -n | awk '/UG[ \t]/{print $2}')
ENV MONGO_HOST=mongodb://host.docker.internal:27017

CMD [ "node", "Main.js" ]