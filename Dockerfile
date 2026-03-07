# Stage 1: Build the Vue application
FROM node:20-slim AS build-stage

# Receive the argument from GitHub Actions
ARG VITE_APP_VERSION
# Set it as an environment variable so Vite can see it
ENV VITE_APP_VERSION=$VITE_APP_VERSION

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]