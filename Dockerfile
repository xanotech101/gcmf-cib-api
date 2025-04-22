FROM node:alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./

RUN npm cache clean --force
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
