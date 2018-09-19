import { Request as ExpressRequest } from 'express';

import Document, {
  ApiConfig,
  ApiConfigJoinTable,
} from '@ntb/models/Document';
import { _, isNumber } from '@ntb/utils';
import { Relation, Relations } from '@ntb/db-utils';

import Filter from './Filter';
import {
  FilterOptions,
  orderValue,
  orderValues,
  QueryFilters,
  QueryFilterOption,
  QueryOptions,
  RequestFilters,
  RequestParameter,
  RequestParameters,
  requestValue,
} from './types';


abstract class AbstractApiRequest {
  fullTextSearchLanguage: string = 'searchNb';
  documentLanguage: string = 'nb';

  model: typeof Document;
  requestObject: ExpressRequest['query'] | ExpressRequest['body'];
  requestObjectForRelations: { [key: string]: any } = {};
  requestObjectStructure: 'query' | 'structured';
  requestParameters: RequestParameters = {};
  requestFilters: RequestFilters = [];
  referrers: string[] = ['*list'];
  nextReferrerPrefixes?: string[];
  requestedId?: string;
  errors: string[] = [];

  fullTextQuery?: string;
  filters?: QueryFilters<QueryFilterOption>;
  filterCount: number = 0;
  filterDepth: number = 1;
  maxFilterDepth: number = 3;

  requestedFields: string[] = [];
  requestedRelations: string[] = [];

  level: number = 0;
  maxLevelDepth: number = 3;

  errorTrace: string = '';

  relations: Relations;
  relationsNames: string[];
  relationRequests: AbstractApiRequest[] = [];

  apiConfig!: ApiConfig;
  apiConfigsForRelations: { [relationsName: string] : ApiConfig } = {};
  apiConfigsForRelationJoins: {
    [relationsName: string] : ApiConfigJoinTable,
  } = {};
  related?: Relation;
  singleInstance: boolean = false;

  validKeys: Set<string> = new Set();
  validFilterKeys: {
    self: Set<string>,
    relations: Set<string>,
    joins: Set<string>,
  } = { self: new Set(), relations: new Set(), joins: new Set() };

  queryOptions: QueryOptions = {
    limit: null,
    offset: null,
    order: null,
    attributes: new Set(),
    relations: [],
    relationIndex: {},
    filters: [],
    freeTextJoin: null,
  };

  constructor(
    model: typeof Document,
    requestObject?: ExpressRequest['query'],
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
      .setAndValidateLangauge()
      .setAndValidateFullTextQuery()
      .setAndValidateFilters()
      .setAndValidateLimitAndOffset()
      .setAndValidateOrdering()
      .setDefaultOrdering()
      .setAndValidateFields()
      .validateInvalidRelationReferences();

    // Abort if an error has occured up until this point
    if (this.errors.length) return this;

    this.processRelationRequests();

    // Abort if an error has occured up until this point
    if (this.errors.length) return this;

    this.setAttributes();

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
  ): RequestParameter {
    const casedKeys = rawKey
      .split('.')
      .map((k) => _.camelCase(k.toLowerCase()));
    const casedKey = casedKeys.join('.');
    const firstCasedKey = casedKeys[0];
    const rawKeys = rawKey.split('.');

    return {
      rawKey,
      rawKeys,
      value,
      rawValue: value,
      errorTrace: trace,
      key: casedKey,
      keys: casedKeys,
      firstKey: firstCasedKey,
    };
  }

  protected abstract processRequestObject(): this;
  protected abstract processLanguageValue(
    rawValue: requestValue | null,
    errorTrace: string,
  ): string | null;
  protected abstract processFullTextQueryValue(
    rawValue: requestValue | null,
    errorTrace: string,
  ): string | null;
  protected abstract processOrderingValue(
    value: requestValue | null,
    errorTrace: string,
  ): string[] | null;
  protected abstract processFieldsValue(
    rawValue: requestValue | null,
    errorTrace: string,
  ): string[] | null;
  protected abstract processRelationRequest(
    model: typeof Document,
    requestObject: ExpressRequest['query'],
    related: Relation,
  ): AbstractApiRequest;

  private setValidKeys(): this {
    this.validKeys.add('fields');

    if (this.apiConfig.translated) {
      this.validKeys.add('language');
    }

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
        this.validKeys.add('language');
      }

      // Add valid filters and relation names
      this.validKeys = new Set([
        ...this.validKeys,
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
        this.validFilterKeys.relations.add(relationName);

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
      });
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

  private setAndValidateLangauge(): this {
    const requestParameter = this.requestParameters.language;
    if (requestParameter) {
      let value = this.processLanguageValue(
        requestParameter.value, requestParameter.errorTrace,
      );

      if (!value) return this;

      value = value.trim().toLowerCase();
      const hasQ = this.requestParameters.q || this.requestParameters['df.q'];

      // Only allow nb|en as langauges if full text searching
      const qLangauges = this.apiConfig.fullTextSearchLangauges
        ? this.apiConfig.fullTextSearchLangauges
        : ['nb'];
      if (hasQ && qLangauges.includes(value)) {
        this.fullTextSearchLanguage = `search${_.startCase(value)}`;
      }
      else if (hasQ) {
        this.errors.push(
          'When using full text search (q) for this document type, the ' +
          `supported languages are: '${qLangauges.join("', '")}'`,
        );
      }

      // Invalid document language value (too long)
      if (value.length > 6) {
        this.errors.push(
          `The value of '${requestParameter.errorTrace}' is invalid`,
        );
        return this;
      }

      // Set document language
      if (this.apiConfig.translated) {
        this.documentLanguage = value;
      }
    }
    return this;
  }

  private setAndValidateFullTextQuery(): this {
    const key = this.related ? 'df.q' : 'q';
    const requestParameter = this.requestParameters[key];

    if (!requestParameter) return this;

    const value = this.processFullTextQueryValue(
      requestParameter.value, requestParameter.errorTrace,
    );

    if (!value) return this;

    this.fullTextQuery = value;
    this.queryOptions.freeTextJoin = [
      "JOIN plainto_tsquery('norwegian', ?) AS full_text_phrase ON TRUE",
      [value],
    ];

    const attr = `[[MODEL-TABLE]].${_.snakeCase(this.fullTextSearchLanguage)}`;
    this.queryOptions.filters = [
      ...this.queryOptions.filters,
      {
        whereType: 'whereRaw',
        options: [
          `${attr} @@ ${name}`,
        ],
      },
    ];

    return this;
  }

  private setAndValidateFilters(): this {
    if (!this.requestFilters) return this;
    const queryFilters = this.processFilters(this.requestFilters);
    if (queryFilters !== null) {
      this.queryOptions.filters = queryFilters;
    }
    return this;
  }

  private processFilters(
    requestFilters: RequestFilters,
  ): null | QueryFilters<QueryFilterOption> {
    const nextFilterDepth = this.filterDepth + 1;
    let queryFilters: QueryFilters<QueryFilterOption> = [];

    for (const requestFilter of requestFilters) {
      // Nested filters
      if (Array.isArray(requestFilter)) {
        if (nextFilterDepth > this.maxFilterDepth) {
          this.errors.push(
            'Max filter depth have been exceeded. You can nest $and/$or ' +
            `filters to a max of ${this.maxFilterDepth} levels.`,
          );
          return null;
        }
        const [op, reqFilters] = requestFilter;
        const subFilters = this.processFilters(reqFilters);
        this.filterDepth = nextFilterDepth;

        if (subFilters === null) {
          return null;
        }

        queryFilters.push([op, subFilters]);
        continue;
      }

      let filterOptions: FilterOptions | undefined;

      // JOIN FILTER
      if (this.validFilterKeys.joins.has(requestFilter.key)) {
        filterOptions = this.processJoinFilter(requestFilter);
      }
      // RELATION FILTER
      else if (this.validFilterKeys.relations.has(requestFilter.key)) {
        filterOptions = this.processRelationFilter(requestFilter);
      }
      // SELF FILTER
      else {
        filterOptions = this.processSelfFilter(requestFilter);
      }

      const filter = new Filter(filterOptions, this.queryOptions);
      this.errors = [
        ...this.errors,
        ...filter.errors,
      ];
      if (filter.queryFilterOptions) {
        queryFilters = [
          ...queryFilters,
          ...filter.queryFilterOptions,
        ];
      }
    }

    return queryFilters.length ? queryFilters : null;
  }

  private processSelfFilter(requestFilter: RequestParameter): FilterOptions {
    const key = requestFilter.key;
    if (
      !this.apiConfig
      || !this.apiConfig.filters
      || !this.apiConfig.filters[key]
    ) {
      throw new Error('Unable to find apiConfig for filters');
    }

    const config = this.apiConfig.filters[key];
    const attr = config.tableAttribute || key;
    return {
      ...config,
      isJoin: true,
      attribute: `[[MODEL-TABLE]].${attr}`,
      snakeCasedAttribute: `"[[MODEL-TABLE]]"."${_.snakeCase(attr)}"`,
      value: requestFilter.value,
      errorTrace: requestFilter.errorTrace,
    };
  }

  private processJoinFilter(requestFilter: RequestParameter): FilterOptions {
    const key = requestFilter.firstKey;
    if (!this.related || !this.related.joinModelClass) {
      throw new Error('Unable to find join model');
    }

    const joinModel = this.related.joinModelClass as any as typeof Document;
    if (
      !joinModel.apiConfig
      || !joinModel.apiConfig.filters
      || !joinModel.apiConfig.filters[key]
    ) {
      throw new Error('Unable to find join model apiConfig for filters');
    }

    const config = joinModel.apiConfig.filters[key];
    const attr = config.tableAttribute || key;
    return {
      ...config,
      isJoin: true,
      attribute: `[[JOIN-TABLE]].${attr}`,
      snakeCasedAttribute: `"[[JOIN-TABLE]]"."${_.snakeCase(attr)}"`,
      value: requestFilter.value,
      errorTrace: requestFilter.errorTrace,
    };
  }

  private processRelationFilter(
    requestFilter: RequestParameter,
  ): FilterOptions {
    // Add relation join
    if (!this.queryOptions.relationIndex[requestFilter.firstKey]) {
      this.queryOptions.relations.push({
        key: requestFilter.firstKey,
        type: 'left',
      });
      this.queryOptions.relationIndex[requestFilter.firstKey] = 'left';
    }

    // Relation existance filter
    if (requestFilter.keys.length === 1) {
      const { idColumn } = this.relations[requestFilter.key].relatedModelClass;
      const { key } = requestFilter;
      const attr = Array.isArray(idColumn) ? idColumn[0] : idColumn;

      return {
        type: 'relationExistance',
        relationName: requestFilter.key,
        value: requestFilter.value,
        isRelation: true,
        errorTrace: requestFilter.errorTrace,
        attribute: `${key}.${attr}`,
        snakeCasedAttribute: `"${_.snakeCase(key)}"."${_.snakeCase(attr)}"`,
      };
    }

    const key = requestFilter.firstKey;
    const apiConfig = this.apiConfigsForRelations[requestFilter.firstKey];

    if (!apiConfig.filters || !apiConfig.filters[key]) {
      throw new Error('Unable to find relation apiConfig for filters');
    }

    const config = apiConfig.filters[key];
    const attr = config.tableAttribute || key;
    return {
      ...config,
      isRelation: true,
      attribute: `${key}.${attr}`,
      snakeCasedAttribute: `"${_.snakeCase(key)}"."${_.snakeCase(attr)}"`,
      value: requestFilter.value,
      errorTrace: requestFilter.errorTrace,
    };
  }

  private setAndValidateLimitAndOffset(): this {
    type limitOffset = 'limit' | 'offset';
    for (const key of ['limit', 'offset'] as limitOffset[]) {
      const requestParameter = this.requestParameters[key];
      const requestValue = requestParameter ? requestParameter.value : null;
      const defaultValue = key === 'limit' && this.apiConfig.paginate
        ? this.apiConfig.paginate.defaultLimit
        : null;
      let value;

      if (requestParameter) {
        value = requestValue;

        if (Array.isArray(requestValue)) {
          if (requestValue.length > 1) {
            this.errors.push(
              `Invalid '${requestParameter.errorTrace}'. ` +
              'Should be a single value.',
            );
          }
          else {
            value = requestValue[0];
          }
        }

        if (value && !isNumber(value)) {
          this.errors.push(
            `Invalid '${requestParameter.errorTrace}' ` +
            `value '${value}'`,
          );
          value = null;
        }

        if (value !== null) {
          value = parseInt(`${value}`, 10);
        }

        value;
      }

      this.queryOptions[key] = value || defaultValue;
    }

    return this;
  }

  private setAndValidateOrdering(): this {
    const requestParameter = this.requestParameters.order;
    const requestValue = requestParameter ? requestParameter.value : null;

    if (!requestParameter) return this;

    // if no request parameter or ordering is disabled
    if (
      !requestParameter
      || !this.apiConfig.ordering
      || this.apiConfig.ordering.disabled
    ) return this;

    // Process ordering request parameter into strings
    const orderStrings = this.processOrderingValue(
      requestValue, requestParameter.errorTrace,
    );

    if (!orderStrings) return this;

    const ordering: orderValues = [];
    for (const orderString of orderStrings) {
      const [rawKey, rawDirection, ...rest] = orderString.trim().split(' ');

      // Invalid format
      if (rest && rest.length) {
        this.errors.push(
          `Invalid format of ordering in '${requestParameter.errorTrace}'. ` +
          "The correct format is '<field_name> asc|desc'",
        );
        return this;
      }

      // Validate direction
      const direction = rawDirection.trim().toUpperCase();
      if (direction !== 'ASC' && direction !== 'DESC') {
        this.errors.push(
          'Invalid format of ordering direction in ' +
          `'${requestParameter.errorTrace}'. Must be 'asc' or 'desc'`,
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
          validJoinFields = joinConfig.ordering.validFields;
        }
      }

      // Verify that the key is valid
      if (
        !this.apiConfig.ordering.validFields.includes(key)
        && !validJoinFields.includes(key)
      ) {
        this.errors.push(
          `Invalid ordering field in '${requestParameter.errorTrace}': ` +
          `'${rawKey.trim()}'`,
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
        'Only allowed to order on one or two fields',
      );
      return this;
    }

    this.queryOptions.order = ordering;
    return this;
  }

  private setDefaultOrdering(): this {
    // Do not set default value if set by query options
    if (this.queryOptions.order) return this;

    // Full text ordering
    const q = this.requestParameters.q || this.requestParameters['df.q'];
    if (this.apiConfig.fullTextSearch && q) {
      const fullTextOrder: orderValue = ['full_text_rank', 'DESC'];
      this.queryOptions.order = [fullTextOrder];
    }

    // Set default value
    const defaultValue = this.apiConfig.ordering
      ? this.apiConfig.ordering.default
      : null;

    if (defaultValue) {
      this.queryOptions.order = defaultValue
        .map(([field, direction]): orderValue => (
          [`[[MODEL-TABLE]].${field}`, direction]
        ));
    }

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
      .filter((k) => (this.apiConfig.defaultRelations || [])
      .includes(k));
    let defaultFields: string[] = [];

    (this.apiConfig.defaultFields || []).forEach((f) => {
      if (f === '*full') {
        defaultFields = defaultFields
          .concat((this.apiConfig.fullFields || []));
      }
      else if (f.startsWith('-')) {
        defaultFields = defaultFields.filter((r) => r !== f.substr(1));
      }
      else {
        defaultFields.push(f);
      }
    });
    defaultFields = Array.from(new Set(defaultFields));

    // Make sure to not include default relations if we're nested too deep
    if (this.level + 1 > this.maxLevelDepth) {
      defaultRelationFields = [];
    }

    // if no request parameter, just return and use the defaults
    if (!requestParameter) {
      this.setRequestFieldsAndRelations(defaultFields, defaultRelationFields);
      return this;
    }

    // Process ordering request parameter into strings
    const fieldStrings = this.processFieldsValue(
      requestValue, requestParameter.errorTrace,
    );

    // Set defaults if fields parameter is not specified
    if (!fieldStrings) {
      this.setRequestFieldsAndRelations(defaultFields, defaultRelationFields);
      return this;
    }

    let valid = true;
    let fields: string[] = [];
    let relationFields = defaultRelationFields;
    for (const [idx, fieldExpressionRaw] of fieldStrings.entries()) {
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
        if (idx === 0 && !['*full', '*default'].includes(fieldExpressionRaw)) {
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
              fieldStrings.length > 1 ? ` on '${fieldExpressionRaw}'. ` : '. '
            }` +
            'This is not a valid field.',
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
      this.setRequestFieldsAndRelations(fields, relationFields);
      return this;
    }

    this.setRequestFieldsAndRelations(defaultFields, defaultRelationFields);
    return this;
  }

  private setRequestFieldsAndRelations(
    fields: string[],
    relations: string[],
  ): this {
    this.requestedFields = fields;
    this.requestedRelations = relations;

    if (!this.requestedFields.length && !this.requestedRelations.length) {
      const forTrace = this.errorTrace
        ? ` for '${this.errorTrace.slice(0, -1)}'`
        : '';

      this.errors.push(
        `No fields${forTrace} have been selected.`,
      );
    }
    return this;
  }

  private validateInvalidRelationReferences(): this {
    for (const relationKey of Object.keys(this.requestObjectForRelations)) {
      if (!this.requestedRelations.includes(relationKey)) {
        const keys = Object.keys(this.requestObjectForRelations[relationKey]);
        for (const key of keys) {
          const relationKeyCased = _.snakeCase(relationKey);
          this.errors.push(
            `Invalid parameter '${relationKeyCased}.${key}'. ` +
            `'${relationKeyCased}' is not included in fields.`,
          );
        }
      }
    }
    return this;
  }

  private processRelationRequests(): this {
    if (!this.requestedRelations.length) return this;

    // Only allow a certain depth
    if ((this.level + 1) > this.maxLevelDepth) {
      this.errors.push(
        'The allowed depth count for queries have been exceeded. ' +
        `Max depth is ${this.maxLevelDepth}`,
      );
    }

    // Loop through relations
    for (const key of this.requestedRelations) {
      const relation = this.relations[key];
      const requestObject = this.requestObjectForRelations[key];
      const relatedModel =
        relation.relatedModelClass as any as typeof Document;
      const relationRequest = this.processRelationRequest(
        relatedModel,
        requestObject,
        relation,
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

  private setAttributes(): this {
    // Translate requested fields into attributes
    if (this.requestedFields) {
      const attrs = this.model.getAPIFieldsToAttributes(
        this.referrers, this.requestedFields,
      );
      this.queryOptions.attributes = new Set(attrs
        .map((a) => a.startsWith('[[') ? a : `[[MODEL-TABLE]].${a}`),
      );
    }

    // Make sure the primary keys are always selected
    const idColumns = Array.isArray(this.model.idColumn)
      ? this.model.idColumn
      : [this.model.idColumn];
    idColumns.forEach((key) => this.queryOptions.attributes.add(
      `[[MODEL-TABLE]].${key}`,
    ));

    // Make sure the fields needed for relations from this model are always
    // selected
    Object.keys(this.relations || {}).forEach((relationKey) => {
      const relation = this.relations[relationKey];
      relation.ownerProp.props.forEach((identifier) => {
        this.queryOptions.attributes.add(`[[MODEL-TABLE]].${identifier}`);
      });
    });

    // Make sure the fields needed for relations to this model are always
    // selected
    if (this.related) {
      this.related.relatedProp.props.forEach((identifier) => {
        this.queryOptions.attributes.add(`[[MODEL-TABLE]].${identifier}`);
      });
    }

    // Make sure the order by key is always selected
    (this.queryOptions.order || []).forEach((orderKey) => {
      if (
        !orderKey[0].startsWith('free_text_rank_')
        && !this.queryOptions.attributes.has(orderKey[0])
      ) {
        this.queryOptions.attributes.add(orderKey[0]);
      }
    });

    return this;
  }
}

export default AbstractApiRequest;
