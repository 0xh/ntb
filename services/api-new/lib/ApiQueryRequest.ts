import { Request as ExpressRequest } from 'express';

import { _ } from '@ntb/utils';
import { Document } from '@ntb/models';
import { Relation } from '@ntb/db-utils';

import AbstractApiRequest from './AbstractApiRequest';


interface requestParameter {
  rawKey: string;
  rawValue: string | string[];
  errorTrace: string;
  key: string;
  value: string[];
  touched: boolean;
}

interface requestParameters {
  [key: string]: requestParameter;
}


class ApiQueryRequest extends AbstractApiRequest {
  requestParameters: requestParameters = {};

  constructor(
    model: typeof Document,
    requestObject: ExpressRequest['query'],
    relation?: Relation,
  ) {
    super(model, requestObject, 'query', relation);
  }

  protected processRequestObject() {
    Object.keys(this.requestObject).forEach((key) => {
      const value = this.requestObject[key];

      if (this.valueIsValidType(key, value)) {
        const casedKey = _.snakeCase(key.toLowerCase());
        this.requestParameters[casedKey] = {
          rawKey: key,
          rawValue: value,
          errorTrace: `${this.errorTrace}${key}`,
          key: casedKey,
          value: typeof value === 'string' ? [value] : value,
          touched: false,
        };
      }
    });
  }

  protected getRequestedFields(): this {
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
