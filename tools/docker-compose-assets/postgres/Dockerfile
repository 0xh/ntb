FROM mdillon/postgis:9.6-alpine

# Install base packages
RUN apk update
RUN apk upgrade

# Set the lang
ENV LANG nb_NO.utf8

# Change TimeZone
RUN apk --no-cache add --update tzdata
ENV TZ=UTC

# Clean APK cache
RUN rm -rf /var/cache/apk/*
