# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen       80;/listen       7860;/g' /etc/nginx/conf.d/default.conf
EXPOSE 7860
CMD ["nginx", "-g", "daemon off;"]
