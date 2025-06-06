# Multi-stage build for Vite app
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user (nginx group already exists)
RUN adduser -S appuser -u 1001 -G nginx

# Set proper permissions
RUN chown -R appuser:nginx /usr/share/nginx/html && \
    chown -R appuser:nginx /var/cache/nginx && \
    chown -R appuser:nginx /var/log/nginx && \
    chown -R appuser:nginx /etc/nginx/conf.d

# Make nginx run as non-root
RUN touch /var/run/nginx.pid && \
    chown -R appuser:nginx /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
