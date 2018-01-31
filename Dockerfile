FROM node:9.4.0-alpine

# Add our user and group first to make sure their IDs get assigned consistently
RUN addgroup -S app && adduser -S -g app app

 RUN npm install --global lerna
#     && mkdir lerna-repo \
#     && cd lerna-repo && lerna init

# Create a directory where the build-related files should live and set it as the
# current working directory
RUN mkdir -p /build
WORKDIR /build

COPY cronjobs/. cronjobs/
COPY migrations/. migrations/
COPY services/. services/
COPY shared/. shared/
COPY migrate.js .babelrc lerna.json package.json yarn.lock ./


RUN lerna bootstrap

RUN ./node_modules/.bin/babel cronjobs --out-dir cronjobs \
    && ./node_modules/.bin/babel migrations --out-dir migrations \
    && ./node_modules/.bin/babel services --out-dir services \
    && ./node_modules/.bin/babel shared --out-dir shared

# Change the ownership of the application code and switch to the unprivileged
# user.
RUN chown -R app:app /build
USER app

ENTRYPOINT node migrate.js up && node services/api/index.js
