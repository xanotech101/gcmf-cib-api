# Use a specific Node.js version (compatible with your app)
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./

# Clean cache and install dependencies
RUN npm cache clean --force
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
