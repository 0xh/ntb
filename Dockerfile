FROM node:10.9.0

# Add our user and group first to make sure their IDs get assigned consistently
RUN groupadd -r app && useradd --no-log-init -r -g app app

# Install gdal
COPY tools/docker/debian-gdal/99defaultrelease /etc/apt/apt.conf.d/
COPY tools/docker/debian-gdal/stable.list tools/docker/debian-gdal/stretch.list /etc/apt/sources.list.d/
RUN apt-get update && \
    apt-get -t stretch --assume-yes install -u gdal-bin

# Install tippecanoe
RUN mkdir -p /tmp/tippecanoe-git
WORKDIR /tmp/tippecanoe-git
RUN git clone https://github.com/mapbox/tippecanoe.git
WORKDIR /tmp/tippecanoe-git/tippecanoe
RUN make -j -s && make install

# install lerna globally
RUN yarn global add lerna

# Create a directory where the build-related files should live and set it as the
# current working directory
RUN mkdir -p /build
WORKDIR /build

# Copy all files that will be compiled using babel
COPY services/api/. services/api/
COPY services/admin/. services/admin/
COPY services/docs/. services/docs/
COPY cronjobs/. cronjobs/
COPY migrate/. migrate/
COPY shared/. shared/
COPY .babelrc lerna.json package.json yarn.lock ./

# Install module dependencies
RUN lerna bootstrap

# Compile using babel
RUN ./node_modules/.bin/babel cronjobs --out-dir cronjobs \
    && ./node_modules/.bin/babel migrate --out-dir migrate \
    && ./node_modules/.bin/babel shared --out-dir shared \
    && ./node_modules/.bin/babel services/api --out-dir services/api \
    && ./node_modules/.bin/babel services/admin/server --out-dir services/admin/server \
    && ./node_modules/.bin/babel services/docs/server --out-dir services/docs/server

# Compile admin-client using webpack
# RUN ./node_modules/.bin/eslint -c services/admin/client/.eslintrc.js services/admin/client/js/
RUN /build/node_modules/.bin/webpack -p --env.production --config /build/services/admin/client/webpack.config.js

# Compile docs-client using webpack
# RUN ./node_modules/.bin/eslint -c services/docs/client/.eslintrc.js services/docs/client/js/
RUN /build/node_modules/.bin/webpack -p --env.production --config /build/services/docs/client/webpack.config.js

# Remove unused application files
RUN rm -rf services/admin/client
RUN rm -rf services/docs/client

# Remove yarn cache
RUN rm -rf /usr/local/share/.cache/yarn


# Clean up apk cache
RUN rm -rf /var/cache/apk/*

# Change the ownership of the application code and switch to the unprivileged
# user.
RUN chown -R app:app /build
USER app
