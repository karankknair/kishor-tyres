FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG REACT_APP_API_URL=http://localhost:8000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "PORT=${PORT:-80} && sed -i \"s/listen 80/listen $PORT/g\" /etc/nginx/conf.d/default.conf && sed -i 's|try_files.*|try_files $uri $uri/ /index.html;|' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
