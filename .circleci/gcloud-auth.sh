# populating the json credentials file from env variable
if [ ! -z "${GCLOUD_DOCKER_CREDENTIALS}" ]; then
  echo $GCLOUD_DOCKER_CREDENTIALS > /tmp/credentials.json
  if [ $? != 0 ]; then
      echo "FAILED to write Google Docker registry credentials into /tmp/credentials.json. Aborting!"
      exit 1
  else
    echo "Successfully populated /tmp/credentials.json"
    gcloud auth activate-service-account --key-file /tmp/credentials.json
    if [ $? != 0 ]; then
        echo "FAILED to authenticate to Google cloud. Aborting!"
        exit 1
    else
      echo "Successfully authenticated to Google cloud."
    fi
  fi
else
  echo "Google credentials have not been set in the environment. Aborting!"
  exit 1
fi
