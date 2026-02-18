FROM node:20.19.5

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN apt-get update && apt-get install -y curl \
  && curl -o /app/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
  && chmod +x /app/wait-for-it.sh \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 8080

CMD ["/app/wait-for-it.sh", "db:3306", "--", "npm", "start"]