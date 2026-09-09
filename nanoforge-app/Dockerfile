FROM node:25-slim

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --no-lockfile

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
