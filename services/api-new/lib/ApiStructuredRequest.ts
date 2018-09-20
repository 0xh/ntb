import { Request as ExpressRequest } from 'express';

import { _, isArrayOfStrings } from '@ntb/utils';
import { Document } from '@ntb/models';
import { Relation } from '@ntb/db-utils';

import AbstractApiRequest from './AbstractApiRequest';
import {
  RequestFilters,
  RequestParameter,
  requestValue,
} from './types';


class ApiStructuredRequest extends AbstractApiRequest {
  constructor(
    model: typeof Document,
    requestObject?: ExpressRequest['query'],
    relation?: Relation,
  ) {
    super(model, requestObject, 'structured', relation);
  }

  protected processRequestObject(): this {
    Object.keys(this.requestObject || {}).forEach((rawKey) => {
      const value = this.requestObject[rawKey];
      const key = _.camelCase(rawKey.toLowerCase());

      // Filters
      if (key === 'filters') {
        const filters = this.processRequestFilters(
          value, `${this.errorTrace}filters`,
        );
        if (filters.length) {
          this.requestFilters = filters;
        }
      }
      // Relation request object
      else if (this.relationsNames.includes(key)) {
        this.requestObjectForRelations[key] = value;
      }

      // Invalid key
      else if (!this.validKeys.has(key)) {
        this.errors.push(
          `Invalid query parameter: ${this.errorTrace}${rawKey}`,
        );
      }
      // Invalid value
      else if (!this.valueIsValidType(value)) {
        this.errors.push(
          `Invalid value of: ${this.errorTrace}${rawKey}`,
        );
      }
      // Add to requestParameters
      else {
        const requestParameter = this.createStructuredRequestParameter(
          rawKey, value,
        );
        this.requestParameters[key] = requestParameter;
      }
    });

    return this;
  }

  protected processLanguageValue(
    rawValue: requestValue | null,
    errorTrace: string,
  ): string | null {
    if (rawValue === null) {
      return null;
    }
    if (typeof rawValue === 'string') {
      return rawValue;
    }

    this.errors.push(`Invalid ${errorTrace} value`);
    return null;
  }

  protected processFullTextQueryValue(
    rawValue: requestValue | null,
    errorTrace: string,
  ): string | null {
    if (rawValue === null) {
      return null;
    }
    if (typeof rawValue === 'string') {
      return rawValue.toLowerCase().trim();
    }

    this.errors.push(`Invalid ${errorTrace} value`);
    return null;
  }

  protected processOrderingValue(
    rawValue: requestValue | null,
    errorTrace: string,
  ): string[] | null {
    if (rawValue === null) {
      return null;
    }
    if (isArrayOfStrings(rawValue)) {
      return rawValue;
    }

    this.errors.push(`Invalid ${errorTrace} value`);
    return null;
  }

  protected processFieldsValue(
    rawValue: requestValue | null,
    errorTrace: string,
  ): string[] | null {
    if (rawValue === null) {
      return null;
    }
    if (isArrayOfStrings(rawValue)) {
      return rawValue;
    }

    this.errors.push(`Invalid ${errorTrace} value`);
    return null;
  }

  protected processRelationRequest(
    model: typeof Document,
    requestObject: ExpressRequest['query'],
    related: Relation,
  ): ApiStructuredRequest {
    const relationRequest = new ApiStructuredRequest(
      model,
      requestObject,
      related,
    );
    return relationRequest;
  }

  private processRequestFilters(
    rawFilterList: any,
    trace: string,
  ): RequestFilters {
    if (!Array.isArray(rawFilterList)) {
      this.errors.push(`Invalid value of ${trace}. Needs to be an array.`);
      return [];
    }

    const res: RequestFilters = [];
    rawFilterList.forEach((rawFilter, idx) => {
      if (!Array.isArray(rawFilter) || rawFilter.length !== 2) {
        this.errors.push(
          `Invalid format of filter in "${trace}" at index ${idx}`,
        );
      }
      else {
        const [key, value] = rawFilter;

        // Nested filters
        if (['$and', '$or'].includes(key.toLowerCase())) {
          const newTrace = `${trace}[${idx} - ${key}]`;
          const requestFilters = this.processRequestFilters(value, newTrace);
          if (requestFilters.length) {
            res.push([key.toLowerCase(), requestFilters]);
          }
        }
        // Add filter
        else {
          const newTrace = `${trace}[${idx} - ${key}]`;
          const requestParameter = this.createRequestParameter(
            key, value, newTrace,
          );

          if (!this.isValidFilterKey(requestParameter.key)) {
            this.errors.push(
              `Invalid filter key '${key}' at '${newTrace}'`,
            );
          }
          else if (!this.valueIsValidType(value)) {
            this.errors.push(
              `Invalid filter value in '${newTrace}'`,
            );
          }
          else {
            res.push(requestParameter);
          }
        }
      }
    });

    return res;
  }

  private createStructuredRequestParameter(
    rawKey: string,
    value: requestValue,
  ): RequestParameter {
    const casedKey = _.camelCase(rawKey.toLowerCase());

    return {
      rawKey,
      value,
      rawKeys: [rawKey],
      rawValue: value,
      errorTrace: `${this.errorTrace}${rawKey}`,
      key: casedKey,
      keys: [casedKey],
      firstKey: casedKey,
    };
  }

  private valueIsValidType(value: any): value is requestValue {
    if (
      typeof value === 'string'
      || isArrayOfStrings(value)
      || typeof value === 'boolean'
      || typeof value === 'number' && Number.isFinite(value)
    ) {
      return true;
    }

    return false;
  }
}

export default ApiStructuredRequest;
