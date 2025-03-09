FROM node:20-alpine3.20

WORKDIR /app-node

COPY . .

RUN npm install

EXPOSE 3200

CMD ["npm", "start"]