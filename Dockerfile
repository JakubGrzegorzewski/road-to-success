# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /workspace

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev express

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy server file
COPY server.js ./

# Expose port 8080 (Cloud Run requirement)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]

