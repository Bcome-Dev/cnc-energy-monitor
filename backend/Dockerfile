FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
