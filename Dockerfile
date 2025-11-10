# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Pass the API key as a build argument
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:1.25-alpine
# Copy the built files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy a custom nginx config if you have one (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
