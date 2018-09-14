import { Request as ExpressRequest } from 'express';

import Document, { apiConfig, apiConfigJoinTable } from '@ntb/models/Document';
import { _, isNumber } from '@ntb/utils';
import { Relation, Relations } from '@ntb/db-utils';


export type requestValue = string | string[] | number | boolean;

export interface requestParameter {
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

type OperatorFilters = ['$and' | '$or', RequestFilters];
export interface RequestFilters extends Array<RequestFilter> {};
export type RequestFilter = requestParameter | OperatorFilters;

type orderValue = [string, 'ASC' | 'DESC'];
type orderValues = orderValue[];


abstract class AbstractApiRequest {
  model: typeof Document;
  requestObject: ExpressRequest['query'] | ExpressRequest['body'];
  requestObjectForRelations: { [key: string]: any } = {};
  requestObjectStructure: 'query' | 'structured';
  requestParameters: requestParameters = {};
  requestFilters: RequestFilters = [];
  referrers: string[] = ['*list'];
  nextReferrerPrefixes?: string[];
  requestedId?: string;
  errors: string[] = [];

  requestedFields: string[] = [];
  requestedRelations: string[] = [];

  level: number = 0;
  maxLevelDepth: number = 3;

  errorTrace: string = '';

  relations: Relations;
  relationsNames: string[];
  relationRequests: AbstractApiRequest[] = [];

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
    order?: orderValues | null
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

  setLevel(level: number): this {
    this.level = level;
    return this;
  }

  verify(): this {
    this
      .setApiConfig()
      .setNextReferrerPrefixes()
      .setRelationsApiConfigs()
      .setValidFilters()
      .setValidKeys()
      .processRequestObject()
      .setAndValidateLimitAndOffset()
      .setAndValidateOrdering()
      .setAndValidateFields()
      .processRelationRequests();
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
    value: requestValue,
    trace: string,
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
      errorTrace: trace,
      key: casedKey,
      keys: casedKeys,
      firstKey: firstCasedKey,
      value: value,
    };
  }

  protected abstract processRequestObject(): this;
  protected abstract processOrderingValue(
    value: requestValue | null,
    errorTrace: string
  ): string[] | null;
  protected abstract processFieldsValue(
    rawValue: requestValue | null,
    errorTrace: string
  ): string[] | null;
  protected abstract processRelationRequest(
    model: typeof Document,
    requestObject: ExpressRequest['query'],
    related: Relation,
  ): AbstractApiRequest;

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

  private setAndValidateLimitAndOffset(): this {
    for (const key of ['limit', 'offset'] as Array<'limit' | 'offset'>) {
      const requestParameter = this.requestParameters[key];
      const requestValue = requestParameter ? requestParameter.value : null;
      const defaultValue = key === 'limit' && this.apiConfig.paginate
        ? this.apiConfig.paginate.defaultLimit
        : null
      let value;

      if (requestParameter) {
        value = requestValue;

        if (Array.isArray(requestValue)) {
          if (requestValue.length > 1) {
            this.errors.push(
              `Invalid '${requestParameter.errorTrace}'. ` +
              'Should be a single value.'
            );
          }
          else {
            value = requestValue[0];
          }
        }

        if (value && !isNumber(value)) {
          this.errors.push(
            `Invalid '${requestParameter.errorTrace}' ` +
            `value '${value}'`
          );
          value = null;
        }

        if (value !== null) {
          value = parseInt(`${value}`);
        }

        value;
      }

      this.queryOptions[key] = value || defaultValue;
    };

    return this;
  }

  private setAndValidateOrdering(): this {
    const requestParameter = this.requestParameters.order;
    const requestValue = requestParameter ? requestParameter.value : null;
    const defaultValue = this.apiConfig.ordering
      ? this.apiConfig.ordering.default
      : null

    if (!requestParameter && !defaultValue) {
      return this;
    }

    // Set default value
    if (defaultValue) {
      this.queryOptions.order = defaultValue
        .map(([field, direction]): orderValue => (
          [`[[MODEL-TABLE]].${field}`, direction]
        ));
    }

    // if no request parameter or ordering is disabled
    if (
      !requestParameter
      || !this.apiConfig.ordering
      || this.apiConfig.ordering.disabled
    ) {
      return this;
    }

    // Process ordering request parameter into strings
    const orderStrings = this.processOrderingValue(
      requestValue, requestParameter.errorTrace
    );

    if (!orderStrings) {
      return this;
    }

    const ordering: orderValues = [];
    for (const orderString of orderStrings) {
      const [rawKey, rawDirection, ...rest] = orderString.trim().split(' ');

      // Invalid format
      if (rest && rest.length) {
        this.errors.push(
          `Invalid format of ordering in '${requestParameter.errorTrace}'. ` +
          `The correct format is '<field_name> asc|desc'`
        );
        return this;
      }

      // Validate direction
      const direction = rawDirection.trim().toUpperCase();
      if (direction !== 'ASC' && direction !== 'DESC') {
        this.errors.push(
          `Invalid format of ordering direction in ` +
          `'${requestParameter.errorTrace}'. Must be 'asc' or 'desc'`
        );
        return this;
      }

      const key = _.camelCase(rawKey.trim().toLowerCase());

      // Find valid join ordering fields
      let validJoinFields: string[] = [];
      if (
        this.related
        && this.apiConfigsForRelationJoins[this.related.name]
      ) {
        const joinConfig = this.apiConfigsForRelationJoins[this.related.name];
        if (joinConfig.ordering) {
          validJoinFields = joinConfig.ordering.validFields
        }
      }

      // Verify that the key is valid
      if (
        !this.apiConfig.ordering.validFields.includes(key)
        && !validJoinFields.includes(key)
      ) {
        this.errors.push(
          `Invalid ordering field in '${requestParameter.errorTrace}': ` +
          `'${rawKey.trim()}'`
        );
        return this;
      }

      const tableAlias = validJoinFields.includes(key)
        ? 'JOIN-TABLE'
        : 'MODEL-TABLE';
      ordering.push([`[[${tableAlias}]].${_.snakeCase(key)}`, direction]);
    }

    if (ordering.length > 2) {
      this.errors.push(
        `Invalid ordering values in '${requestParameter.errorTrace}'.` +
        `Only allowed to order on one or two fields`
      );
      return this;
    }

    this.queryOptions.order = ordering;
    return this;
  }

  private setAndValidateFields(): this {
    const requestParameter = this.requestParameters.fields;
    const requestValue = requestParameter ? requestParameter.value : null;
    const validFieldKeys = this.model.getBaseFields(this.referrers);

    // Relation extra fields
    if (this.related && this.related.joinTableExtras) {
      this.related.joinTableExtras.forEach((extra) => {
        validFieldKeys.push(extra.aliasProp);
      });
    }

    // Set default fields
    let defaultRelationFields = this.relationsNames
      .filter((k) => (this.apiConfig.defaultRelations || []).includes(k));
    let defaultFields: string[] = [];

    (this.apiConfig.defaultFields || []).forEach((f) => {
      if (f === '*full') {
        defaultFields = defaultFields.concat((this.apiConfig.fullFields || []));
      }
      else if (f.startsWith('-')) {
        defaultFields = defaultFields.filter((r) => r !== f.substr(1));
      }
      else {
        defaultFields.push(f);
      }
    });
    defaultFields = Array.from(new Set(defaultFields));

    // if no request parameter, just return and use the defaults
    if (!requestParameter) {
      return this;
    }

    // Process ordering request parameter into strings
    const fielsStrings = this.processFieldsValue(
      requestValue, requestParameter.errorTrace
    );

    if (!fielsStrings) {
      return this;
    }

    let valid = true;
    let fields: string[] = [];
    let relationFields = defaultRelationFields;
    for (const [idx, fieldExpressionRaw] of fielsStrings.entries()) {
      const fieldExpression = fieldExpressionRaw.toLowerCase().trim();
      // Set full fields
      if (idx === 0 && fieldExpressionRaw === '*full') {
        fields = (this.apiConfig.fullFields || []);
        relationFields = defaultRelationFields;
      }
      // Set defaults
      else if (idx === 0 && fieldExpressionRaw === '*default') {
        fields = defaultFields;
        relationFields = defaultRelationFields;
      }
      // Process each request field expression
      else {
        // Reset the defaults
        if (idx === 0 && ['*full', '*default'].includes(fieldExpressionRaw)) {
          fields = [];
          relationFields = [];
        }

        let remove = false;
        let f = fieldExpression;
        if (f.startsWith('-')) {
          remove = true;
          f = f.substr(1);
        }
        f = _.camelCase(f);

        if (
          !validFieldKeys.includes(f)
          && !this.relationsNames.includes(f)
        ) {
          this.errors.push(
            `Invalid '${requestParameter.errorTrace}' value ` +
            `'${requestParameter.rawValue}'` +
            `${
              fielsStrings.length > 1 ? ` on '${fieldExpressionRaw}'. ` : '. '
            }` +
            'This is not a valid field.'
          );
          valid = false;
        }

        if (this.relationsNames.includes(f)) {
          if (remove) {
            relationFields = relationFields.filter((r) => r !== f);
          }
          else {
            relationFields.push(f);
          }
        }
        else if (remove) {
          fields = fields.filter((r) => r !== f);
        }
        else {
          fields.push(f);
        }
      }
    }

    // All fields validated
    if (valid && (fields.length || relationFields.length)) {
      this.requestedFields = fields;
      this.requestedRelations = relationFields;
    }
    else {
      this.requestedFields = defaultFields;
      this.requestedRelations = defaultRelationFields;
    }

    return this;
  }

  private processRelationRequests(): this {
    // Only allow a certain depth
    const hasRelations = !!Object.keys(this.requestObjectForRelations).length;
    if (hasRelations && (this.level + 1) > this.maxLevelDepth) {
      this.errors.push(
        `The allowed depth count for queries have been exceeded. ` +
        `Max depth is ${this.maxLevelDepth}`
      );
    }

    // Loop through relations
    for (const key in this.requestObjectForRelations) {
      const relation = this.relations[key];
      const requestObject = this.requestObjectForRelations[key];
      const relatedModel =
        relation.relatedModelClass as any as typeof Document;
      const relationRequest = this.processRelationRequest(
        relatedModel,
        requestObject,
        relation
      );

      if (!this.nextReferrerPrefixes) {
        throw new Error('Next referrer prefixes is not set');
      }

      const nextReferrers = this.nextReferrerPrefixes
        .map((prefix) => `${prefix}${key}`);

      relationRequest
        .setReferrers(nextReferrers)
        .setErrorTrace(`${this.errorTrace}${_.snakeCase(key)}.`)
        .setLevel(this.level + 1)
        .verify();

      this.errors = [
        ...this.errors,
        ...relationRequest.errors,
      ];

      this.relationRequests.push(relationRequest);
    }

    return this;
  }
}

export default AbstractApiRequest;
