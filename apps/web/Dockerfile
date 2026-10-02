# Multi-stage build for VYOM PWA
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist /app/dist

EXPOSE 3000
ENV PORT=3000

CMD ["serve", "-s", "dist", "-l", "3000"]
