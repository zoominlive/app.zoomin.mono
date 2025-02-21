FROM node:16.20.2-slim AS build
WORKDIR /app
COPY ./package.json /app/
COPY ./yarn.lock /app/
RUN yarn
COPY . /app
RUN yarn build

FROM nginx:1.27.4-alpine
COPY --from=build  --chown=nginx:nginx /app/build /usr/share/nginx/html
COPY .well-known /usr/share/nginx/html/.well-known
RUN echo "SUCCESS" >> /usr/share/nginx/html/healthcheck.html
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN rm -rf /etc/nginx/sites-available/default && rm -rf /etc/nginx/sites-enabled/default && rm -rf /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
