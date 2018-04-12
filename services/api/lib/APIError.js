export default class APIError extends Error {
  constructor(...args) {
    super(...args);

    if (args[1]) {
      this.apiErrors = args[1].apiErrors;
    }

    Error.captureStackTrace(this, APIError);
  }
}
