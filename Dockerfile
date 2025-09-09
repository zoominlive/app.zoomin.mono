FROM node:18.20-slim AS builder
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM node:18.20-slim AS production
ENV NODE_ENV=production
ENV FRONTEGG_API_GATEWAY_URL=https://api.us.frontegg.com

RUN apt update && apt upgrade -y && \
        apt install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
        && apt-get clean

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000

CMD ["npm", "start"]
