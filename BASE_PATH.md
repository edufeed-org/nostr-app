# Base Path Configuration

This document explains how the base path is configured for different deployment environments.

## GitHub Pages

For GitHub Pages, we must set the base path to `/nostr-app/` since the app is deployed to a subdirectory of the domain `edufeed-org.github.io`.

This is handled in the GitHub Actions workflows by passing the `--base=/nostr-app/` flag to the Vite build command:

```yaml
- name: Build application
  run: npm run build -- --base=/nostr-app/
```

## Docker Deployment

For Docker deployment (or any deployment to a root domain), the base path should be `/` (root).

If you deploy the Docker image to a subdirectory:
1. Modify the Dockerfile to set the appropriate base path during build:

```dockerfile
# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application - note the base path setting
# Change this to the appropriate path if deployed to a subdirectory
RUN npm run build -- --base=/

# Continue with the production stage...
```

## Local Development

For local development, Vite uses a base path of `/` by default, which is correct for localhost.

## Adding to vite.config.ts (Alternative Approach)

If you prefer to set the base path in the configuration file instead of the command line, you can add it to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Set the base path - use environment variables to switch between environments
  base: process.env.VITE_BASE_PATH || '/',
})
```

Then set the environment variable during the build process:

```yaml
- name: Build application for GitHub Pages
  run: VITE_BASE_PATH=/nostr-app/ npm run build
```

Or for Docker:
```dockerfile
RUN VITE_BASE_PATH=/ npm run build
```