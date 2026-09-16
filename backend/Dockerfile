FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose backend API & socket port
EXPOSE 4000

# Default command: run migrations then start server
CMD ["sh", "-c", "npm run migrate && npm start"]
