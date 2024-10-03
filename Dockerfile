# Stage 1: Build the Node.js application
FROM node:18 AS builder

# Stage 1: Set the working directory for the application
WORKDIR /app

# Stage 1: Copy the package.json and lock files to the container
COPY package.json ./

# Stage 1: Copy the rest of the application source code
COPY packages ./packages

RUN yarn install

# Stage 1: Build the Node.js application
RUN cd packages/server && yarn build

# Stage 2: Build the Caddy image
FROM caddy:2.7-builder AS caddy

# Stage 2: Using xcaddy build the Caddy binary along with it's modules 
RUN xcaddy build \
  --with github.com/caddy-dns/cloudflare@a9d3ae2690a1d232bc9f8fc8b15bd4e0a6960eec

# Stage 3: Create the final image with the Node.js application and Caddy
FROM node:18-alpine

# Stage 3: Expose the ports for Caddy (port 80, HTTP) and (port 443, HTTPS)
EXPOSE 80 443

# Stage 3: Set up the Caddy configuration file (Caddyfile)
COPY packages/server/Caddyfile /etc/caddy/Caddyfile

# Stage 3: Set the working directory to the location of the Caddyfile
WORKDIR /etc/caddy

# Stage 3: Copy the built Node.js application from the builder stage
# COPY --from=builder /app /srv
COPY --from=builder /app/packages/server/build /srv/build
COPY --from=builder /app/node_modules /srv/node_modules

# Stage 3: Copy Caddy from the caddy stage
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy

# Run the Node.js application and Caddy when the container starts
CMD ["sh", "-c", "node --experimental-specifier-resolution=node /srv/build/index.js & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
