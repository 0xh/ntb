FROM node:9.4.0-alpine

# Add our user and group first to make sure their IDs get assigned consistently
RUN addgroup -S app && adduser -S -g app app

# Add make, gcc, g++ and python as it's needed for node-gyp (nodehun).
# Will be removed after installing yarn dependencies
RUN apk add --no-cache make gcc g++ python

# install lerna globally
RUN yarn global add lerna

# Create a directory where the build-related files should live and set it as the
# current working directory
RUN mkdir -p /build
WORKDIR /build

COPY cronjobs/. cronjobs/
COPY migrate/. migrate/
COPY services/. services/
COPY shared/. shared/
COPY .babelrc lerna.json package.json yarn.lock ./


RUN lerna bootstrap

RUN ./node_modules/.bin/babel cronjobs --out-dir cronjobs \
    && ./node_modules/.bin/babel migrate --out-dir migrate \
    && ./node_modules/.bin/babel services --out-dir services \
    && ./node_modules/.bin/babel shared --out-dir shared

# Remove alpine deps and clean up cache
RUN apk del make gcc g++ python \
    rm -rf /var/cache/apk/*

# Change the ownership of the application code and switch to the unprivileged
# user.
RUN chown -R app:app /build
USER app

ENTRYPOINT node services/api/index.js
