# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx to listen on Cloud Run's PORT
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD sed -i "s/listen 8080/listen $PORT/g" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
