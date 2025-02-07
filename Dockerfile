# stage1 - build react app first 
FROM amazonlinux:2 as build
RUN yum clean all
RUN yum install -y initscripts bash g++ gcc icu git python3
# Install as Root
RUN yum install https://rpm.nodesource.com/pub_16.x/nodistro/repo/nodesource-release-nodistro-1.noarch.rpm -y
RUN yum install nodejs -y --setopt=nodesource-nodejs.module_hotfixes=1
RUN npm i -g yarn
WORKDIR /app
COPY ./package.json /app/
COPY ./yarn.lock /app/
RUN yarn
COPY . /app
RUN yarn build

# stage 2 - build the final image and copy the react build files
FROM nginx:1.17.8-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY .well-known /usr/share/nginx/html/.well-known
RUN echo "SUCCESS" >> /usr/share/nginx/html/healthcheck.html
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 0755 /usr/share/nginx/html
RUN rm -rf /etc/nginx/sites-available/default && rm -rf /etc/nginx/sites-enabled/default && rm -rf /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
