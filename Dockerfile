# Stage 1: Build the Node.js application
FROM node:18 AS builder

# Stage 1: Set the working directory for the application
WORKDIR /app

# Stage 1: Copy the package.json and lock files to the container
COPY package.json package-lock.json ./

# Stage 1: Copy the rest of the application source code
COPY packages ./packages

# Stage 1: Install dependencies
RUN npm ci

# Stage 1: Build the Node.js application
RUN npm run build

# Stage 2: Create the final image with the Node.js application
FROM node:18-alpine

# Stage 2: Expose the ports for the Node.js application
EXPOSE 3000

# Stage 2: Copy the built Node.js application from the builder stage
COPY --from=builder /app /srv

# Run the Node.js application and Caddy when the container starts
CMD ["sh", "-c", "node --experimental-specifier-resolution=node /srv/packages/server/build/index.js"]
