# Production Dockerfile for frontend
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Declare build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY

# Make them available as environment variables during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite will use the ENV vars)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
