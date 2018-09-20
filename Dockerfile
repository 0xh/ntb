FROM eu.gcr.io/dnt-docker-registry-public/ntb-base-image:1.0.0

# Create a directory where the build-related files should live and set it as the
# current working directory
RUN mkdir -p /app
WORKDIR /app

# Copy application files
COPY custom-typings/. custom-typings/
COPY cronjobs/. cronjobs/
COPY migrate/. migrate/
COPY services/. services/
COPY shared/. shared/
COPY build.sh tsconfig.json tslint.json package.json babel.config.js lerna.json yarn.lock ./

# Run build
RUN ./build.sh

# Set workdir
WORKDIR /app/build

# Change the ownership of the application code and switch to the unprivileged
# user.
RUN chown -R app:app /app
RUN mkdir -p /home/app
RUN chown -R app:app /home/app

USER app
