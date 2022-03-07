#Specify base image
FROM node:16.13.0-alpine

#set working directory
WORKDIR /usr/app

#copy package.json to docker directory
COPY ./package.json ./

#install dependencies
RUN npm install

#copy project to docker directory
COPY ./ ./

#Default command
CMD ["npm", "start"]

