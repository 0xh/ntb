import { Request as ExpressRequest } from 'express';

import { _ } from '@ntb/utils';
import { Document } from '@ntb/models';
import { Relation } from '@ntb/db-utils';

import AbstractApiRequest from './AbstractApiRequest';


class ApiQueryRequest extends AbstractApiRequest {
  constructor(
    model: typeof Document,
    requestObject: ExpressRequest['query'],
    relation?: Relation,
  ) {
    super(model, requestObject, 'query', relation);
  }

  protected processRequestObject(): this {
    Object.keys(this.requestObject).forEach((rawKey) => {
      const value = this.requestObject[rawKey];

      if (this.valueIsValidType(rawKey, value)) {
        const requestParameter = this.createRequestParameter(rawKey, value);

        // Invalid key
        if (
          !this.validKeys.has(requestParameter.key)
          && !this.relationsNames.includes(requestParameter.firstKey)
        ) {
          this.errors.push(
            `Invalid query parameter: ${this.errorTrace}${rawKey}`
          );
        }
        // Add to requestFilters
        else if (this.isValidFilterKey(requestParameter.key)) {
          this.requestFilters.push(requestParameter);
        }
        // Add to requestParameters
        else if (
          !this.isValidFilterKey(requestParameter.key)
          && !this.relationsNames.includes(requestParameter.firstKey)
        ) {
          this.requestParameters[requestParameter.key] = requestParameter;
        }
        // Add key/value to request object for relation
        else if (
          !this.isValidFilterKey(requestParameter.key)
          && this.relationsNames.includes(requestParameter.firstKey)
        ) {
          // Initiate object for relation if it does not exist
          if (!this.requestObjectForRelations[requestParameter.firstKey]) {
            this.requestObjectForRelations[requestParameter.firstKey] = {};
          }

          const { rawKeys } = requestParameter;
          const sliceIdx = rawKeys.length > 2 && rawKeys[1] === 'df' ? 2 : 1;
          const nextKey = rawKeys.slice(sliceIdx).join('.');
          this.requestObjectForRelations[requestParameter.firstKey][nextKey] =
            this.requestObject[rawKey];
        }
      }
    });

    return this;
  }

  private valueIsValidType(
    key: string,
    value: any,
  ): value is string | string[] {
    // If the value is not a string or an array, something is wrong.
    if (typeof value !== 'string' && !Array.isArray(value)) {
      this.errors.push(`Invalid query parameter: ${this.errorTrace}${key}`);
      return false;
    }

    // If the value is an array, make sure each array-value is a string
    if (Array.isArray(value) && value.some((v) => v !== 'string')) {
      this.errors.push(`Invalid query parameter: ${this.errorTrace}${key}`);
      return false;
    }

    return true;
  }
}

export default ApiQueryRequest;
