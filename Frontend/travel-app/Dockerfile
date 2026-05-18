# Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . ./
RUN npm run build -- --configuration production

# Serve stage
FROM nginx:alpine AS runtime

COPY --from=build /app/dist/travel-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
