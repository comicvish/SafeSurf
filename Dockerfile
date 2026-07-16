FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY index.html styles.css app.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

# Cloud Run injects PORT at runtime; nginx's built-in envsubst entrypoint
# renders /etc/nginx/templates/*.template into /etc/nginx/conf.d using it.
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
