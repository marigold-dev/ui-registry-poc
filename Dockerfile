# Install dependencies only when needed
FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM node:16 AS builder

RUN npm i -g esy
RUN wget https://gitlab.com/ligolang/ligo/-/jobs/3438281030/artifacts/raw/ligo
RUN chmod +x ./ligo
RUN cp ./ligo /usr/local/bin

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

EXPOSE 80

CMD ["npm", "start"]