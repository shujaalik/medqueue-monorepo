FROM node:18-slim

# Install chromium and all necessary libraries for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set env variables for Puppeteer and Node.js
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    PORT=5000 \
    NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package configs
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy rest of the application
COPY . .

# Expose server port
EXPOSE 5000

# Start command
CMD [ "npm", "start" ]
