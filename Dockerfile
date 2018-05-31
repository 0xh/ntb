FROM node:10.2.1-alpine

# Add our user and group first to make sure their IDs get assigned consistently
RUN addgroup -S app && adduser -S -g app app

# Add make, gcc, g++ and python as it's needed for node-gyp (nodehun).
RUN apk add --no-cache make gcc g++ python

# install lerna globally
RUN yarn global add lerna

# Create a directory where the build-related files should live and set it as the
# current working directory
RUN mkdir -p /build
WORKDIR /build

COPY services/api/. services/api/
COPY services/admin/server/. services/admin/server/
COPY cronjobs/. cronjobs/
COPY migrate/. migrate/
COPY shared/. shared/
COPY .babelrc lerna.json package.json yarn.lock ./


RUN lerna bootstrap

RUN ./node_modules/.bin/babel cronjobs --out-dir cronjobs \
    && ./node_modules/.bin/babel migrate --out-dir migrate \
    && ./node_modules/.bin/babel shared --out-dir shared \
    && ./node_modules/.bin/babel services/api --out-dir services/api \
    && ./node_modules/.bin/babel services/admin/server --out-dir services/admin/server

# Change the ownership of the application code and switch to the unprivileged
# user.
RUN chown -R app:app /build
USER app

CMD node services/api/index.js
