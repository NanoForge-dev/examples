FROM node:25-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --allow-build=bun

COPY . .

RUN pnpm run build

CMD ["pnpm", "run", "start"]
