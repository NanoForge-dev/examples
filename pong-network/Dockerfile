FROM node:26-slim

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

RUN npm install -g pnpm

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

CMD ["pnpm", "start"]
