# Multi-stage build for optimal size
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY proxy/package*.json ./proxy/

# Install all dependencies
RUN npm install
# Install proxy dependencies
RUN cd proxy && npm install --production

# Copy source code
COPY . .

# Set build-time environment variable
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Build Vue app
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install serve for static files
RUN npm install -g serve

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy proxy server
COPY --from=builder /app/proxy ./proxy

# Fix ownership and drop privileges
RUN chown -R node:node /app
USER node

WORKDIR /app

# Expose ports
EXPOSE 3000 3001

# Start both services
CMD ["sh", "-c", "serve -s dist -l 3000 & cd proxy && node server.js"]