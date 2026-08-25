FROM node:20-alpine

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 8080
CMD ["pnpm", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "8080"]
