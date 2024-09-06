FROM nginx:1.17.4-alpine

ENV PORT 3001
EXPOSE 3001

COPY nginx.conf /etc/nginx/nginx.conf

COPY ./build /var/www

ENTRYPOINT ["nginx","-g","daemon off;"]

