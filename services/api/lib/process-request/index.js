import APIError from '../api-error';
import executeQueries from './execute-queries';
import validateAndFormat from './validate-and-format';


/**
 * Validates and executes the request.
 * @param {object} entryModel The entry db.model
 * @param {object} queryObject A preconfigured nested query object or the
 *                             ExpressJS req.query object
 * @param {string} id Id of a single object
 * @param {boolean} usExpressJSQueryObject If the queryObject is a expressJS
 *                                         object
 */
export default async function (
  entryModel,
  queryObject,
  id = null,
  usExpressJSQueryObject = true,
) {
  const [errors, handler] = validateAndFormat(
    entryModel, queryObject, id, usExpressJSQueryObject
  );

  if (errors.length) {
    throw new APIError(
      'The query is not valid',
      { apiErrors: errors }
    );
  }

  return executeQueries(handler);
}
