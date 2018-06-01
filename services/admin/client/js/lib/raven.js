/* global Raven */

export default () => {
  if (
    process.env.NODE_ENV === 'production'
    && process.env.SERVICES_ADMIN_SENTRY_DSN
  ) {
    try {
      Raven
        .config(process.env.SERVICES_ADMIN_SENTRY_DSN, {
          release: window.sherpa.version,
        })
        .install();
    }
    catch (error) {
      // Silently ignore if Raven initialization fails
    }
  }
};
