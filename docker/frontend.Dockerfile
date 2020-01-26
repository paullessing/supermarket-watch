FROM nginx:alpine

COPY docker/nginx.frontend.conf /etc/nginx/nginx.conf

EXPOSE 80

WORKDIR /usr/share/nginx/html
COPY ./dist/apps/frontend ./
