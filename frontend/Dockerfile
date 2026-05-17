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

# nginx config template that uses $PORT from Railway
RUN printf 'server {\n  listen ${PORT:-80};\n  location / {\n    root /usr/share/nginx/html;\n    index index.html;\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/templates/default.conf.template

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["/bin/sh", "-c", "export PORT=${PORT:-80} && envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
