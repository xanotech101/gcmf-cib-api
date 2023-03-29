FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm cache clear --force
RUN npm install

# Copy app source code
COPY . .

EXPOSE 8000

# Start the server
CMD ["npm", "start"]
