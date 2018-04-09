export default class APIError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, APIError);
  }
}
