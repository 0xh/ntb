export default class APIError extends Error {
  apiErrors: string[] = [];

  constructor(message?: string, extra?: { apiErrors: string[] }) {
    super(message);

    if (extra) {
      this.apiErrors = extra.apiErrors;
    }

    Error.captureStackTrace(this, APIError);
  }
}
