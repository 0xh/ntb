import APIError from '../api-error';
import validateAndFormat from './validate-and-format';
import executeQueries from './execute-queries';


/**
 * Validates and executes the request.
 * @param {object} entryModel The entry db.model
 * @param {object} queryObject a preconfigured nested query object or the
 *                             ExpressJS req.query object
 */
export default async function (entryModel, queryObject) {
  const [errors, handler] = validateAndFormat(entryModel, queryObject);

  if (errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: errors }
    );
  }

  return executeQueries(handler);
}
