FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose the Expo web server port
EXPOSE 8081

# Start the Expo web dev server
CMD ["npm", "run", "web"]
