FROM node:18-slim

WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Create a startup script
RUN echo '#!/bin/bash\n\
echo "Starting Prisma Studio with DATABASE_URL: ${DATABASE_URL}"\n\
npx prisma generate\n\
npx prisma studio --port 8080\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose the port Prisma Studio runs on
EXPOSE 8080

# Command to run startup script
CMD ["/app/start.sh"]

# # Expose the port Prisma Studio runs on
# EXPOSE 8080

# # Command to run Prisma Studio with host 0.0.0.0 to make it accessible externally
# CMD ["npx", "prisma", "studio", "--port", "8080"]