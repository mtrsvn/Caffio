FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose the default backend port
EXPOSE 4000

# Start the Node server
CMD ["npm", "start"]
