FROM ubuntu:latest
LABEL authors="jakubgrzegorzewski"

ENTRYPOINT ["top", "-b"]

# Stage 1: Build the Vue application
FROM node:20-slim AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine AS production-stage
# Copy the built files from the previous stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy a custom nginx config to handle Vue Router history mode
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]