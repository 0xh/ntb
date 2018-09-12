import { Request as ExpressRequest } from 'express';

import Document, { apiConfig, apiConfigJoinTable } from '@ntb/models/Document';
import { _ } from '@ntb/utils';
import { Relation, Relations } from '@ntb/db-utils';


type requestValue = string | string[] | number | boolean;


interface requestParameter {
  rawKey: string;
  rawKeys: string[];
  rawValue: requestValue;
  errorTrace: string;
  key: string;
  keys: string[];
  firstKey: string;
  value: requestValue;
}

interface requestParameters {
  [key: string]: requestParameter;
}

type OperatorFilters = ['$and' | '$or', requestFilters];
interface requestFilters extends Array<RequestFilter> {};
type RequestFilter = requestParameter | OperatorFilters;


abstract class ApiRequest {
  model: typeof Document;
  requestObject: ExpressRequest['query'] | ExpressRequest['body'];
  requestObjectForRelations: { [key: string]: any } = {};
  requestObjectStructure: 'query' | 'structured';
  requestParameters: requestParameters = {};
  requestFilters: requestFilters = [];
  referrers: string[] = ['*list'];
  nextReferrerPrefixes?: string[];
  requestedId?: string;
  errors: string[] = [];

  errorTrace: string = '';

  relations: Relations;
  relationsNames: string[];

  apiConfig!: apiConfig;
  apiConfigsForRelations: { [relationsName: string] : apiConfig } = {};
  apiConfigsForRelationJoins: {
    [relationsName: string] : apiConfigJoinTable
  } = {};
  related?: Relation;
  singleInstance: boolean = false;

  validKeys: Set<string> = new Set();
  validFilterKeys: {
    self: Set<string>,
    relations: Set<string>,
    joins: Set<string>,
  } = { self: new Set(), relations: new Set(), joins: new Set() };

  queryOptions: {
    limit?: number | null,
    offset?: number | null,
  } = {};

  constructor(
    model: typeof Document,
    requestObject: ExpressRequest['query'],
    requestObjectStructure: 'query' | 'structured' = 'query',
    related?: Relation,
  ) {
    this.model = model;
    this.requestObject = requestObject;
    this.requestObjectStructure = requestObjectStructure;
    this.related = related;

    this.relations = this.model.getRelations();
    this.relationsNames = Object.keys(this.relations);

    // If it's related as a single relation
    if (related && related === Document.BelongsToOneRelation) {
      this.singleInstance = true;
    }
  }

  setRequestedId(requestedId: string): this {
    this.requestedId = requestedId;
    this.singleInstance = true;

    if (this.referrers === ['*list']) {
      this
        .setReferrers(['*single'])
        .setNextReferrerPrefixes();
    }
    return this;
  }

  setSingleInstance(state: boolean = true): this {
    this.singleInstance = state;
    return this;
  }

  setReferrers(referrers: string[]): this {
    this.referrers = referrers;
    return this;
  }

  setErrorTrace(errorTrace: string): this {
    this.errorTrace = errorTrace;
    return this;
  }

  verify(): this {
    this
      .setApiConfig()
      .setNextReferrerPrefixes()
      .setRelationsApiConfigs()
      .setValidFilters()
      .setValidKeys()
      .processRequestObject();
      // .validateKeys()
      // .setAndValidateLimitAndOffset();
    return this;
  }

  execute() {
    this.verify();
    return { test: 2 };
  }

  protected isValidFilterKey(key: string): boolean {
    return (
      this.validFilterKeys.self.has(key)
      || this.validFilterKeys.relations.has(key)
      || this.validFilterKeys.joins.has(key)
    );
  }

  protected createRequestParameter(
    rawKey: string,
    value: requestValue
  ): requestParameter {
    const casedKeys = rawKey
      .split('.')
      .map((k) => _.camelCase(k.toLowerCase()));
    const casedKey = casedKeys.join('.');
    const firstCasedKey = casedKeys[0];
    const rawKeys = rawKey.split('.');

    return {
      rawKey: rawKey,
      rawKeys: rawKeys,
      rawValue: value,
      errorTrace: `${this.errorTrace}${rawKey}`,
      key: casedKey,
      keys: casedKeys,
      firstKey: firstCasedKey,
      value: typeof value === 'string' ? [value] : value,
    };
  }

  protected abstract processRequestObject(): this;

  private setValidKeys(): this {
    this.validKeys.add('fields');

    if (!this.singleInstance) {
      // Set pagination keys
      if (this.apiConfig.paginate && !this.apiConfig.paginate.disabled) {
        this.validKeys.add('limit');
        this.validKeys.add('offset');
      }

      // Set ordering key
      if (this.apiConfig.ordering && !this.apiConfig.ordering.disabled) {
        this.validKeys.add('order');
      }

      // Set full text search key
      if (this.apiConfig.fullTextSearch) {
        this.validKeys.add('q');
      }

      // Add valid filters and relation names
      this.validKeys = new Set([
        ...this.validKeys,
        ...this.relationsNames,
        ...this.validFilterKeys.self,
        ...this.validFilterKeys.relations,
        ...this.validFilterKeys.joins,
      ]);
    }

    return this;
  }

  private setValidFilters(): this {
    if (!this.singleInstance) {
      // Set filter keys on current model
      if (this.apiConfig.filters) {
        Object.keys(this.apiConfig.filters)
          .forEach((key) => this.validFilterKeys.self.add(key));
      }

      // Set filter keys on related models
      this.relationsNames.forEach((relationName) => {
        // For the related model
        const relationApiConfig = this.apiConfigsForRelations[relationName];
        if (relationApiConfig && relationApiConfig.filters) {
          Object.keys(relationApiConfig.filters)
            .forEach((key) => this.validFilterKeys.relations.add(
              `${relationName}.${key}`,
            ));
        }

        // For the join (through) model
        const joinApiConfig = this.apiConfigsForRelationJoins[relationName];
        if (joinApiConfig && joinApiConfig.filters) {
          Object.keys(joinApiConfig.filters)
            .forEach((key) => this.validFilterKeys.joins.add(
              `${relationName}.${key}`,
            ));
        }
      })
    }

    return this;
  }

  private setApiConfig(): this {
    this.apiConfig = this.model.getApiConfig(this.referrers);

    // If it's a single object, make sure to disable search and pagination
    if (this.requestedId) {
      this.apiConfig.paginate = false;
      this.apiConfig.ordering = false;
      this.apiConfig.fullTextSearch = false;
      this.apiConfig.filters = false;
    }

    return this;
  }

  private setNextReferrerPrefixes(): this {
    this.nextReferrerPrefixes = [`${this.model.name}.`];
    if (this.requestedId) {
      this.nextReferrerPrefixes.push(`${this.model.name}.single.`);
    }
    return this;
  }

  private setRelationsApiConfigs(): this {
    this.relationsNames.forEach((relationName) => {
      const relation = this.relations[relationName];
      const referrers = (this.nextReferrerPrefixes as string[])
        .map((prefix) => `${prefix}${relationName}`);
      const relationModel = <any>relation.relatedModelClass as typeof Document;
      const relationApiConfig = relationModel.getApiConfig(referrers);
      this.apiConfigsForRelations[relationName] = relationApiConfig;

      if (relation.joinModelClass) {
        const joinModel = <any>relation.joinModelClass as typeof Document;
        if (joinModel.apiConfig) {
          this.apiConfigsForRelationJoins[relationName] = joinModel.apiConfig;
        }
      }
    });

    return this;
  }

  // private validateKeys(): this {
  //   // A key must either be listed in this.validKeys or be a 'a.b' formatted
  //   // key where 'a' is a valid relation name

  //   const keys = Object.keys(this.requestObject);
  //   keys.forEach((rawKey) => {
  //     const camelCasedKey = rawKey.split('.')
  //       .map((subKey) => _.camelCase(subKey.toLowerCase().trim()))
  //       .join('.');
  //     const firstKey = camelCasedKey.split('.', 1)[0];

  //     if (
  //       !this.validKeys.has(camelCasedKey)
  //       || (
  //         rawKey.includes('.')
  //         && !this.relationsNames.includes(firstKey)
  //       )
  //     ) {
  //       this.errors.push(
  //         `Invalid query parameter: ${this.errorTrace}${rawKey}`
  //       );
  //       delete this.requestObject[rawKey];
  //     }
  //   });

  //   return this;
  // }

  // private setAndValidateLimitAndOffset(): this {
  //   for (const key of ['limit', 'offset'] as Array<'limit' | 'offset'>) {
  //     const queryLimitList = this.getQueryObjectValueForKey(key);
  //     const defaultValue = key === 'limit' && this.apiConfig.paginate
  //       ? this.apiConfig.paginate.defaultLimit
  //       : null
  //     let value;

  //     if (queryLimitList) {
  //       const queryLimit = queryLimitList[0];
  //       value = queryLimit.value;

  //       // Special verifications for query-structured requestObject
  //       if (this.requestObjectStructure === 'query') {
  //         if (value.length > 1) {
  //           this.errors.push(
  //             `Invalid ${this.errorTrace}${queryLimit.originalKey}. ` +
  //             'There are multiple occurences in the url.'
  //           );
  //           value = null;
  //         }
  //         else {
  //           value = value[0];
  //         }
  //       }

  //       if (!isNumber(value)) {
  //         this.errors.push(
  //           `Invalid ${this.errorTrace}${queryLimit.originalKey} ` +
  //           `value '${queryLimit.value}'`
  //         );
  //         value = null;
  //       }

  //       if (value !== null) {
  //         value = parseInt(`${value}`);
  //       }
  //     }

  //     this.queryOptions[key] = value || defaultValue;
  //   };

  //   return this;
  // }

  // private setAndValidateOrdering(): this {
  //   const queryOrderList = this.getQueryObjectValueForKey('order');
  //   const defaultValue = this.apiConfig.ordering
  //     ? this.apiConfig.ordering.default
  //     : null;
  //   let value;

  //   if (
  //     queryOrderList &&
  //     this.apiConfig.ordering &&
  //     !this.apiConfig.ordering.disabled
  //   ) {
  //     const queryOrder = queryOrderList[0];
  //     value = queryOrder.value;

  //     if (
  //       typeof value !== 'string'
  //       || !isArrayOfStrings(value)
  //     ) {
  //       this.errors.push(
  //         `Invalid ${this.errorTrace}${queryOrder.originalKey} value.`
  //       );
  //       value = null;
  //     }
  //     value;
  //     // Special verifications for query-structured requestObject
  //     if (this.requestObjectStructure === 'query' && value) {
  //       value = this.validateQueryOrderingLength(value, queryOrder);
  //     }
  //     else if (
  //       value
  //       && this.requestObjectStructure === 'structured'
  //       && !Array.isArray(value)
  //     ) {
  //       value = [value];
  //     }

  //     value;
  //   }

  //   return this;
  // }

  // private validateQueryOrderingLength(
  //   value: string | string[],
  //   queryOrder: queryObjectValue
  // ): string[] | null {
  //   if (Array.isArray(value) && value.length > 1) {
  //     this.errors.push(
  //       `Invalid ${this.errorTrace}${queryOrder.originalKey}. ` +
  //       'There are multiple occurences in the url.'
  //     );
  //     return null;
  //   }
  //   else {
  //     return value[0].split(',');
  //   }
  // }

  // private getQueryObjectValueForKey(key: string) {
  //   const values: queryObjectValue[] = [];

  //   Object.keys(this.requestObject).forEach((rawKey) => {
  //     const firstKey = _.camelCase(rawKey.split('.', 1)[0].toLowerCase().trim());
  //     if (firstKey === key) {
  //       values.push({
  //         originalKey: rawKey,
  //         value: this.requestObject[rawKey],
  //       });
  //     }
  //   });

  //   return values.length ? values : null;
  // }
}

export default ApiRequest;
