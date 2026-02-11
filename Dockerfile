FROM node:20.19.5

WORKDIR /app

COPY package*.json ./
COPY . /app

RUN npm install

EXPOSE 8080

CMD ["npm", "start"]