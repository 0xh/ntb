import { Request as ExpressRequest } from 'express';

import { _, isArrayOfStrings } from '@ntb/utils';
import { Document } from '@ntb/models';
import { Relation } from '@ntb/db-utils';

import AbstractApiRequest, { requestValue } from './AbstractApiRequest';


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

      if (!this.valueIsValidType(rawKey, value)) {
        this.errors.push(
          `Invalid value in '${this.errorTrace}${rawKey}'`
        );
      }
      else {
        let processedRawKey = rawKey;
        if (this.related && rawKey.toLowerCase().startsWith('df.')) {
          processedRawKey = rawKey.substr(3);
        }
        const requestParameter = this.createRequestParameter(
          processedRawKey,
          typeof value === 'string' ? [value] : value,
          `${this.errorTrace}${rawKey}`
        );

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
          const nextKey = rawKeys.slice(1).join('.');
          this.requestObjectForRelations[requestParameter.firstKey][nextKey] =
            this.requestObject[rawKey];
        }
      }
    });

    return this;
  }

  protected processOrderingValue(
    rawValue: requestValue | null,
    errorTrace: string
  ): string[] | null {
    if (typeof rawValue === 'string') {
      return [rawValue];
    }
    else if (isArrayOfStrings(rawValue)) {
      if (rawValue.length > 1) {
        this.errors.push(
          `Invalid ${errorTrace} value. Should single value.`
        );
        return null;
      }
      return rawValue[0].split(',');
    }

    this.errors.push(`Invalid ${errorTrace} value`);
    return null;
  }

  protected processFieldsValue(
    rawValue: requestValue | null,
    errorTrace: string
  ): string[] | null {
    if (typeof rawValue === 'string') {
      return rawValue.split(',');
    }
    else if (isArrayOfStrings(rawValue)) {
      if (rawValue.length > 1) {
        this.errors.push(
          `Invalid ${errorTrace} value. Should single value.`
        );
        return null;
      }
      return rawValue[0].split(',');
    }

    if (!rawValue) {
      return null;
    }

    this.errors.push(`Invalid ${errorTrace} value`);
    return null;
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

  protected processRelationRequest(
    model: typeof Document,
    requestObject: ExpressRequest['query'],
    related: Relation,
  ): ApiQueryRequest {
    const relationRequest = new ApiQueryRequest(
      model,
      requestObject,
      related,
    );
    return relationRequest;
  };
}

export default ApiQueryRequest;
