import { Request as ExpressRequest } from 'express';

import Document, { apiConfig, apiConfigJoinTable } from '@ntb/models/Document';
import { _ } from '@ntb/utils';
import { Relation, Relations } from '@ntb/db-utils';


abstract class ApiRequest {
  model: typeof Document;
  requestObject: ExpressRequest['query'] | ExpressRequest['body'];
  requestObjectStructure: 'query' | 'structured';
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
      .validateKeys();
    return this;
  }

  execute() {
    this.verify();
    return { test: 2 };
  }

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

  private validateKeys(): this {
    // A key must either be listed in this.validKeys or be a 'a.b' formatted
    // key where 'a' is a valid relation name

    const keys = Object.keys(this.requestObject);
    keys.forEach((rawKey) => {
      const camelCasedKey = rawKey.split('.')
        .map((subKey) => _.camelCase(subKey.toLowerCase().trim()))
        .join('.');
      const firstKey = camelCasedKey.split('.', 1)[0];

      if (
        !this.validKeys.has(camelCasedKey)
        || (
          rawKey.includes('.')
          && !this.relationsNames.includes(firstKey)
        )
      ) {
        this.errors.push(
          `Invalid query parameter: ${this.errorTrace}${rawKey}`
        );
        delete this.requestObject[rawKey];
      }
    });

    return this;
  }
}

export default ApiRequest;
