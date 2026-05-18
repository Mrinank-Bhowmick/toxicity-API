FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
COPY package.json tsconfig.json ./
COPY src ./src
RUN pnpm install --prod=false --frozen-lockfile=false
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
ENV NODE_ENV=production
COPY package.json ./
RUN pnpm install --prod --frozen-lockfile=false
COPY --from=build /app/dist ./dist
COPY training_data.csv ./training_data.csv
EXPOSE 3001
CMD ["node", "dist/main.js"]
