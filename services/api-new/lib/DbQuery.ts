import Document, { ApiConfig } from '@ntb/models/Document';
import { Logger, _, isObject } from '@ntb/utils';
import {
  Model,
  st,
  knex,
  Knex,
  QueryBuilder,
  Relation,
  RelationProperty,
} from '@ntb/db-utils';

import {
  QueryOptions,
  DbQueryResult,
  Operator,
  QueryFilterOption,
  QueryFilters,
} from './types';
import AbstractApiRequest from './AbstractApiRequest';


type ao = { [key: string]: any };

type QueryInstance = QueryBuilder<Model, Model[], Model[]>;
interface IdentifiersByProp {
  [key: string]: string[];
}

const logger = Logger.getLogger();


class DbQuery {
  result?: DbQueryResult;

  model: typeof Model;
  apiRequest: AbstractApiRequest;
  joinModel?: typeof Model;
  apiConfig: ApiConfig;
  queryOptions: QueryOptions;

  constructor(
    model: typeof Document,
    apiRequest: AbstractApiRequest,
  ) {
    this.model = model as any as typeof Model;
    this.apiRequest = apiRequest;

    this.apiConfig = this.apiRequest.apiConfig;
    this.queryOptions = this.apiRequest.queryOptions;

    if (this.apiRequest.related && this.apiRequest.related.joinModelClass) {
      this.joinModel = this.apiRequest.related.joinModelClass;
    }
  }

  async execute() {
    await this.processMainQuery();

    // Run any relation queries if any documents have been found
    if (
      this.result
      && (
        Array.isArray(this.result)
        || this.result.rows
      )
    ) {
      let outerInstances: Model[] = [];
      if (Array.isArray(this.result)) {
        outerInstances = this.result;
      }
      else if (this.result && this.result.rows) {
        outerInstances = this.result.rows;
      }

      if (!outerInstances.length) {
        return;
      }
      await this.processRelationQueries(this.apiRequest, outerInstances);

      if (Array.isArray(this.result)) {
        this.result = this.formatRows(
          this.apiRequest,
          this.result,
        );
      }
      else if (this.result.rows) {
        this.result.rows = this.formatRows(
          this.apiRequest,
          this.result.rows,
        );
      }
    }

    return;
  }

  private async processMainQuery(): Promise<void> {
    if (this.apiConfig.paginate && !this.apiConfig.paginate.disabled) {
      let count = 0;
      let rows: Model[] = [];

      if (this.queryOptions.limit && this.queryOptions.limit > 0) {
        [count, rows] = await Promise.all([
          this.mainQuery(true),
          this.mainQuery(false),
        ]);
      }
      else {
        count = await this.mainQuery(true);
        rows = [];
      }

      this.result = {
        count,
        rows,
        limit: this.queryOptions.limit,
        offset: this.queryOptions.offset,
      };

      return;
    }

    this.result = [];
    return;
  }

  private async processRelationQueries(
    rootApiRequest: AbstractApiRequest,
    outerInstances: Model[],
  ): Promise<void> {
    if (!Object.keys(rootApiRequest.relationRequests).length) {
      return;
    }

    await Promise.all(
      Object.keys(rootApiRequest.relationRequests).map(async (key) => {
        const apiRequest = rootApiRequest.relationRequests[key];
        const manyToManyRelation = Document.ManyToManyRelation as any;
        const hasOneThroughRelation = Document.HasOneThroughRelation as any;
        const belongsToOneRelation = Document.BelongsToOneRelation as any;
        const hasManyRelation = Document.HasManyRelation as any;
        const hasOneRelation = Document.HasOneRelation as any;
        let relationInstances: Model[] = [];

        // Paginated relation to many using a through table
        if (
          apiRequest.apiConfig.paginate
          && !apiRequest.apiConfig.paginate.disabled
          && apiRequest.related
          && apiRequest.related instanceof manyToManyRelation
          && !(apiRequest.related instanceof hasOneThroughRelation)
        ) {
          logger.debug(`${key}: Executing paginated multi through relation`);
          relationInstances = await this.paginatedMultiThroughRelation(
            apiRequest,
            outerInstances,
          );
        }
        // Relation to many using a through table that is not paginated
        else if (
          (
            !apiRequest.apiConfig.paginate
            || apiRequest.apiConfig.paginate.disabled
          )
          && apiRequest.related
          && apiRequest.related instanceof manyToManyRelation
          && !(apiRequest.related instanceof hasOneThroughRelation)
        ) {
          logger.debug(`${key}: Executing multi through relation`);
          relationInstances = await this.multiThroughRelation(
            apiRequest,
            outerInstances,
          );
        }
        // Single instance relation
        else if (
          apiRequest.related
          && apiRequest.related instanceof belongsToOneRelation
        ) {
          logger.debug(`${key}: Executing single relation`);
          relationInstances = await this.singleOrMultiRelation(
            apiRequest,
            outerInstances,
            true,
          );
        }
        // Relation to many not using av through table that is not paginated
        else if (
          (
            !apiRequest.apiConfig.paginate
            || apiRequest.apiConfig.paginate.disabled
          )
          && apiRequest.related
          && apiRequest.related instanceof hasManyRelation
          && !(apiRequest.related instanceof hasOneRelation)
        ) {
          logger.debug(`${key}: Executing multi relation`);
          relationInstances = await this.singleOrMultiRelation(
            apiRequest,
            outerInstances,
            false,
          );
        }
        // Paginated relation to many not using av through table
        else if (
          apiRequest.apiConfig.paginate
          && !apiRequest.apiConfig.paginate.disabled
          && apiRequest.related instanceof hasManyRelation
          && !(apiRequest.related instanceof hasOneRelation)
        ) {
          logger.debug(`${key}: Executing paginated multi relation`);
          relationInstances = await this.paginatedMultiRelation(
            apiRequest,
            outerInstances,
          );
        }
        else {
          throw new Error(
            'Not yet implemented this kind of relation',
          );
        }

        // Recursive relations
        const recursive = Object.keys(apiRequest.relationRequests).length;
        if (recursive && relationInstances.length) {
          await this.processRelationQueries(apiRequest, relationInstances);
        }
      }),
    );
  }

  private async mainQuery(count: true): Promise<number>;
  private async mainQuery(count: false): Promise<Model[]>;
  private async mainQuery(count = false): Promise<Model[] | number> {
    const model = this.model;
    const modelDocument = this.model as any as typeof Document;
    let query = model.query();
    const tableName = _.snakeCase(model.tableName);
    const joinTableName = this.joinModel
      ? _.snakeCase(this.joinModel.tableName)
      : '';

    // Attributes to select if it's a count query
    if (count) {
      query = query.countDistinct(
        `${model.tableName}.${model.idColumn} as count`,
      );
    }

    // Attributes to select if it's not a count query
    if (!count && this.queryOptions.attributes) {
      const attrs: string[] = [];
      for (const a of this.queryOptions.attributes) {
        const geometryAttributes = modelDocument.geometryAttributes || [];

        if (
          a.startsWith('[[MODEL-TABLE]].')
          && geometryAttributes.includes(a.slice(16))
        ) {
          const snakedA = _.snakeCase(a.slice(16));
          return st.asGeoJSON(knex.raw(
            `ST_Transform(${tableName}.${snakedA}, 4326)`,
          )).as(a.slice(16));
        }

        let name: string = '';
        if (a.startsWith('[[MODEL-TABLE]].')) {
          name = `${tableName}.${_.snakeCase(a.slice(16))}`;
        }
        else if (a.startsWith('[[JOIN-TABLE]].')) {
          if (!this.joinModel) {
            throw new Error('this.joinModel is not set');
          }

          name = `${joinTableName}.${_.snakeCase(a.slice(15))}`;
        }

        attrs.push(name);
      }

      // Full text rank attribute
      if (this.queryOptions.fullTextJoin) {
        attrs.push(
          'ts_rank(search_nb, full_text_phrase) AS full_text_rank',
        );
      }

      if (this.queryOptions.relations) {
        query = query.distinct(...attrs).select();
      }
      else {
        query = query.select(...attrs);
      }
    }

    // Joins
    if (this.queryOptions.relations) {
      query = this.addRelationJoins(
        this.apiRequest,
        query,
        this.model.tableName,
      );
    }

    // Add full text joins
    if (this.queryOptions.fullTextJoin) {
      query = this.addFullTextJoins(this.apiRequest, query);
    }

    // Filters
    if (this.queryOptions.filters) {
      query = this.setFilters(
        query,
        '$and',
        this.queryOptions.filters,
        model.tableName,
      );
    }

    // Set ordering
    if (this.queryOptions.order && !count) {
      this.queryOptions.order.forEach((order) => {
        const attr = order[0]
          .replace('[[MODEL-TABLE]]', model.tableName)
          .replace('[[JOIN-TABLE]]', joinTableName);
        query = query.orderBy(attr, order[1]);
      });
    }

    // Set limit
    if (this.queryOptions.limit && !count) {
      query = query.limit(this.queryOptions.limit);
    }

    // Set offset
    if (this.queryOptions.offset && !count) {
      query = query.offset(this.queryOptions.offset);
    }


    // Wait for query to finish
    const res = await query;

    // Return count
    if (count) {
      const firstRow = res[0] as { [key: string]: any };
      if (res.length && firstRow.count) {
        return +firstRow.count as number;
      }
      return 0;
    }

    // Return rows
    return res;
  }

  private async paginatedMultiThroughRelation(
    apiRequest: AbstractApiRequest,
    outerInstances: Model[],
  ): Promise<Model[]> {
    const relationInstances: Model[] = [];
    const related = apiRequest.related as Relation;

    // Find identifiers from outer instances
    const [identifiersFound, identifiersByProp] =
      this.findIdentifiersForThroughRelations(related);

    // Nothing to join on
    if (!identifiersFound) return [];

    const promises: QueryInstance[] = [
      this.createPaginatedMultiThroughCountQuery(
        apiRequest,
        identifiersByProp,
      ),
    ];

    // Add main query if limit > 1
    if (apiRequest.queryOptions.limit) {
      promises.push(
        this.createPaginatedMultiThroughMainQuery(
          apiRequest,
          identifiersByProp,
        ),
      );
    }

    // Retrieve result
    const [counts, rows] = await Promise.all(promises);

    const baseOpts = {
      limit: apiRequest.queryOptions.limit,
      offset: apiRequest.queryOptions.offset,
    };

    // Map the rows to the include model
    (rows || []).forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((instance) => (
          related.ownerProp.props
            .map((p, idx) =>
              (instance as ao)[p] === (row as ao)[`outerId${idx}`],
            )
            .every((e) => e)
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      const instance = related.relatedModelClass
        .fromJson(row, { skipValidation: true });

      outers.forEach((outerRow) => {
        const outer = outerRow as ao;
        if (!outer[related.name]) {
          outer[related.name] = {
            ...baseOpts,
            rows: [],
            count: 0,
          };
        }

        outer[related.name].rows.push(instance);
      });

      // Add instance for nested relations later
      relationInstances.push(instance);
    });

    // Map the counts to the include model
    counts.forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((instance) => (
          related.ownerProp.props
            .map((p, idx) =>
              (instance as ao)[p] === (row as ao)[`outerId${idx}`],
            )
            .every((e) => e)
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      outers.forEach((outerRow) => {
        const outer = outerRow as ao;
        if (!outer[related.name]) {
          outer[related.name] = {
            ...baseOpts,
            rows: [],
            count: 0,
          };
        }

        outer[related.name].count = +(row as ao).count;
      });
    });

    return relationInstances;
  }

  private async multiThroughRelation(
    apiRequest: AbstractApiRequest,
    outerInstances: Model[],
  ): Promise<Model[]> {
    const relationInstances: Model[] = [];
    const related = apiRequest.related as Relation;

    // Find identifiers from outer instances
    const [identifiersFound, identifiersByProp] =
      this.findIdentifiersForThroughRelations(related);

    // Nothing to join on
    if (!identifiersFound) return [];

    // Retrieve result
    const rows = await this.createMultiThroughMainQuery(
      apiRequest,
      identifiersByProp,
    );

    // Map the rows to the include model
    (rows || []).forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((instance) => (
          related.ownerProp.props
            .map((p, idx) =>
              (instance as ao)[p] === (row as ao)[`outerId${idx}`],
            )
            .every((e) => e)
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      const instance = related.relatedModelClass
        .fromJson(row, { skipValidation: true });

      outers.forEach((outerRow) => {
        const outer = outerRow as ao;
        if (!outer[related.name]) {
          outer[related.name] = [];
        }

        outer[related.name].push(instance);
      });

      // Add instance for nested relations later
      relationInstances.push(instance);
    });

    return relationInstances;
  }

  private async singleOrMultiRelation(
    apiRequest: AbstractApiRequest,
    outerInstances: Model[],
    isSingle: boolean,
  ): Promise<Model []> {
    const relationInstances: Model[] = [];
    const related = apiRequest.related as Relation;
    const model = apiRequest.model as any as typeof Model;
    const { queryOptions } = apiRequest;
    const geometryAttributes =
      (model as any as typeof Document).geometryAttributes;

    // Set owner table id columns
    const ownerTableName = related.ownerModelClass.tableName;
    const ownerIdColumns = Array.isArray(related.ownerModelClass.idColumn)
      ? related.ownerModelClass.idColumn
      : [related.ownerModelClass.idColumn];

    // Find identifiers from outer instances
    const [identifiersFound, identifiersByProp] =
      this.findIdentifiersForThroughRelations(related);

    // Nothing to join on
    if (!identifiersFound) return [];

    // Create query
    let query = model.query();

    // Attributes to select
    if (queryOptions.attributes) {
      const attrs: (string | Knex.Raw)[] = [];
      for (const a of queryOptions.attributes) {
        // GeoJSON
        const snakedTableName = _.snakeCase(model.tableName);
        if (
          a.startsWith('[[MODEL-TABLE]].')
          && (geometryAttributes || []).includes(a.slice(16))
        ) {
          const snakedA = _.snakeCase(a.slice(16));
          attrs.push(
            st.asGeoJSON(knex.raw(
              `ST_Transform(${snakedTableName}.${snakedA}, 4326)`,
            )).as(a.slice(16)) as any as Knex.Raw,
          );
          continue;
        }

        attrs.push(`${model.tableName}.${a}`);
      }

      query = query.distinct(...attrs);
    }

    // Select owner identifiers
    const ownerAttributes = ownerIdColumns.map((p, idx) => (
      `${ownerTableName}.${p} AS outerId${idx}`
    ));
    query = query.distinct(...ownerAttributes).select();

    // Join related table
    query = query.innerJoin(
      related.ownerModelClass.tableName,
      function joinFn() {
        // Filter on inner and join table attributes
        related.relatedProp.props.forEach((modelProp, idx) => {
          const ownerProp = related.ownerProp.props[idx];
          const mProp = `${model.tableName}.${modelProp}`;
          const rProp = `${ownerTableName}.${ownerProp}`;
          this.on(mProp, '=', rProp);
        });

        // Filter on outerInstace identifiers
        Object.keys(identifiersByProp).forEach((p) => {
          const identifiers = identifiersByProp[p];
          if (!identifiers.length) {
            this.onNull(`${ownerTableName}.${p}`);
          }
          else {
            this.onIn(`${ownerTableName}.${p}`, identifiers);
          }
        });
      },
    );

    // Add relations joins (for filters and eager loading)
    if (queryOptions.relations) {
      query = this.addRelationJoins(apiRequest, query, model.tableName);
    }

    // Add full text joins
    if (queryOptions.fullTextJoin) {
      query = this.addFullTextJoins(apiRequest, query);
    }

    // Filters
    if (queryOptions.filters) {
      query = this.setFilters(
        query,
        '$and',
        queryOptions.filters,
        model.tableName,
        related,
      );
    }

    // Set ordering
    if (queryOptions.order && queryOptions.order.length) {
      queryOptions.order.forEach((order) => {
        const attr = order[0]
          .replace('[[MODEL-TABLE]]', model.tableName);
        query = query.orderBy(attr, order[1]);
      });
    }

    const rows = await query;

    rows.forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((instance) => (
          related.ownerProp.props
            .map((p, idx) =>
              (instance as ao)[p] === (row as ao)[`outerId${idx}`],
            )
            .every((e) => e)
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      const instance = related.relatedModelClass
        .fromJson(row, { skipValidation: true });

      outers.forEach((outerRow) => {
        const outer = outerRow as ao;
        if (!isSingle) {
          if (!outer[related.name]) {
            outer[related.name] = [];
          }

          outer[related.name].push(instance);
        }
        else {
          outer[related.name] = instance;
        }
      });

      // Add instance for nested relations later
      relationInstances.push(instance);
    });

    return relationInstances;
  }

  private async paginatedMultiRelation(
    apiRequest: AbstractApiRequest,
    outerInstances: Model[],
  ): Promise<Model[]> {
    const related = apiRequest.related as Relation;
    const { queryOptions } = apiRequest;
    const relationInstances: Model[] = [];

    // Set owner table id columns
    const ownerIdColumns = Array.isArray(related.ownerModelClass.idColumn)
      ? related.ownerModelClass.idColumn
      : [related.ownerModelClass.idColumn];

    // Find identifiers from outer instances
    const [identifiersFound, identifiersByProp] =
      this.findIdentifiersForThroughRelations(related);

    // Nothing to join on
    if (!identifiersFound) return [];

    const promises: QueryInstance[] = [
      this.createPaginatedMultiCountQuery(
        apiRequest,
        identifiersByProp,
      ),
    ];

    if (queryOptions.limit) {
      promises.push(
        this.createPaginatedMultiMainQuery(
          apiRequest,
          identifiersByProp,
        ),
      );
    }

    // Execute
    const [counts, rows] = await Promise.all(promises);


    const baseOpts = {
      limit: queryOptions.limit,
      offset: queryOptions.offset,
    };

    (rows || []).forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((instance) => (
          ownerIdColumns
            .map((p, idx) =>
              (instance as ao)[p] === (row as ao)[`outerId${idx}`],
            )
            .every((e) => e)
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      const instance = related.relatedModelClass
        .fromJson(row, { skipValidation: true });

      outers.forEach((outerRow) => {
        const outer = outerRow as ao;
        if (!outer[related.name]) {
          outer[related.name] = {
            ...baseOpts,
            rows: [],
            count: 0,
          };
        }

        outer[related.name].rows.push(instance);
      });

      // Add instance for nested relations later
      relationInstances.push(instance);
    });

    counts.forEach((row) => {
      // Find the main rows
      const outers = outerInstances
        .filter((instance) => (
          related.ownerProp.props
            .map((p, idx) =>
              (instance as ao)[p] === (row as ao)[`outerId${idx}`],
            )
            .every((e) => e)
        ));
      if (!outers || !outers.length) {
        throw new Error('Unable to map include.row with outer.row');
      }

      outers.forEach((outerRow) => {
        const outer = outerRow as ao;
        if (!outer[related.name]) {
          outer[related.name] = {
            ...baseOpts,
            rows: [],
            count: 0,
          };
        }

        outer[related.name].count = +(row as ao).count;
      });
    });

    return relationInstances;
  }

  private createPaginatedMultiThroughCountQuery(
    apiRequest: AbstractApiRequest,
    identifiersByProp: IdentifiersByProp,
  ): QueryInstance {
    // Create query
    let query = this.createMultiThroughSubQuery(apiRequest, false);
    const model = apiRequest.model as any as typeof Model;
    const related = apiRequest.related as Relation;
    const joinTable = related.joinTable as string;
    const joinTableOwnerProp = related.joinTableOwnerProp as RelationProperty;
    const { queryOptions } = apiRequest;

    const groupByProps = joinTableOwnerProp.props
      .map((p) => `${joinTable}.${p}`);
    const selectProps = groupByProps
      .map((p, idx) => `${p} AS outerId${idx}`);

    query = query
      .select(
        ...selectProps,
        knex.raw(
          `COUNT(DISTINCT "inner"."${model.idColumn}") AS count`,
        ),
      )
      .groupBy(groupByProps);

    // Add relations joins (for filters and eager loading)
    if (queryOptions.relations) {
      query = this.addRelationJoins(
        apiRequest,
        query,
        'inner',
      );
    }

    // Add free text joins
    if (queryOptions.fullTextJoin) {
      query = this.addFullTextJoins(apiRequest, query);
    }

    // Filters
    if (queryOptions.filters) {
      query = this.setFilters(
        query,
        '$and',
        queryOptions.filters,
        'inner',
        related,
      );
    }

    // Filter on outer identifiers
    Object.keys(identifiersByProp).forEach((ownerProp) => {
      // Find the index of ownerProp
      const idx = related.ownerProp.props.indexOf(ownerProp);

      // Map index to same index of join table
      const prop = joinTableOwnerProp.props[idx];

      const identifiers = identifiersByProp[ownerProp];
      if (!identifiers.length) {
        query = query.whereNull(`${joinTable}.${prop}`);
      }
      else {
        query = query.whereIn(`${joinTable}.${prop}`, identifiers);
      }
    });

    return query;
  }

  private createPaginatedMultiThroughMainQuery(
    apiRequest: AbstractApiRequest,
    identifiersByProp: IdentifiersByProp,
  ): QueryInstance {
    // Create subquery
    let subQuery = this.createMultiThroughSubQuery(apiRequest, true);
    const model = apiRequest.model as any as typeof Model;
    const related = apiRequest.related as Relation;
    const joinTable = related.joinTable as string;
    const { queryOptions } = apiRequest;
    const geometryAttributes =
      (model as any as typeof Document).geometryAttributes;

    // Attributes to select
    if (queryOptions.attributes) {
      const extras: ao = {};

      (related.joinTableExtras || []).forEach((e) => {
        extras[e.aliasProp] = e.joinTableCol;
      });
      const attrs: (string | Knex.Raw)[] = [];

      for (const a of queryOptions.attributes) {
        // Extras
        if (
          a.startsWith('[[JOIN-TABLE]].')
          && Object.keys(extras).includes(a.slice(15))
        ) {
          attrs.push(`${joinTable}.${extras[a.slice(15)]} AS ${a.slice(15)}`);
          continue;
        }

        // GeoJSON
        if (
          a.startsWith('[[MODEL-TABLE]].')
          && (geometryAttributes || []).includes(a.slice(16))
        ) {
          const snakedA = _.snakeCase(a.slice(16));
          attrs.push(
            st.asGeoJSON(knex.raw(
              `ST_Transform("inner".${snakedA}, 4326)`,
            )).as(a.slice(16)) as any as Knex.Raw,
          );
          continue;
        }

        const attr = a
          .replace('[[MODEL-TABLE]]', 'inner')
          .replace('[[JOIN-TABLE]]', joinTable);
        attrs.push(attr);
      }

      if (queryOptions.fullTextJoin) {
        attrs.push(knex.raw(
          'ts_rank(search_nb, full_text_phrase) AS full_text_rank',
        ));
      }

      subQuery = subQuery.select(...attrs);
    }

    // Add relations joins (for filters and eager loading)
    if (queryOptions.relations) {
      subQuery = this.addRelationJoins(apiRequest, subQuery, 'inner');
    }

    // Add free text joins
    if (queryOptions.fullTextJoin) {
      subQuery = this.addFullTextJoins(apiRequest, subQuery);
    }

    // Filters
    if (queryOptions.filters) {
      subQuery = this.setFilters(
        subQuery,
        '$and',
        queryOptions.filters,
        'inner',
        related,
      );
    }

    // Set ordering
    if (queryOptions.order && queryOptions.order.length) {
      queryOptions.order.forEach((order) => {
        const attr = order[0]
          .replace('[[MODEL-TABLE]]', 'inner')
          .replace('[[JOIN-TABLE]]', joinTable);
        subQuery = subQuery.orderBy(attr, order[1]);
      });
    }

    // Set limit
    if (queryOptions.limit) {
      subQuery = subQuery.limit(queryOptions.limit);
    }

    // Set offset
    if (queryOptions.offset) {
      subQuery = subQuery.offset(queryOptions.offset);
    }


    // Set primary query select attributes
    const attributes = related.ownerProp.props
      .map((p, idx) => `outer.${p} AS outerId${idx}`);

    // Create primary query
    let query = knex.select([...attributes, `${related.name}.*`]);

    // From
    query = query.from({ outer: related.ownerModelClass.tableName });

    // Join lateral subquery
    query = query.joinRaw(
      `CROSS JOIN LATERAL (?) "${_.snakeCase(related.name)}"`,
      knex.raw(subQuery as any),
    );

    // Filter on outer identifiers
    Object.keys(identifiersByProp).forEach((p) => {
      const identifiers = identifiersByProp[p];
      if (!identifiers.length) {
        query = query.whereNull(`outer.${p}`);
      }
      else {
        query = query.whereIn(`outer.${p}`, identifiers);
      }
    });

    return query as any as QueryInstance;
  }

  private createMultiThroughSubQuery(
    apiRequest: AbstractApiRequest,
    joinOnOuter = true,
  ): QueryInstance {
    // Create sub query
    const model = apiRequest.model as any as typeof Model;
    const related = apiRequest.related as Relation;
    const joinTable = related.joinTable as string;
    let query = model.query().alias('inner');

    // Join through table
    query = query.innerJoin(joinTable, function joinFn() {
      // Filter on inner and join table attributes
      related.relatedProp.props.forEach((modelProp, idx) => {
        const rProps = related.joinTableRelatedProp as RelationProperty;
        const joinTableProp = rProps.props[idx];
        const mProp = `"inner".${modelProp}`;
        const jProp = `${related.joinTable}.${joinTableProp}`;
        this.on(mProp, '=', jProp);
      });

      // Filter from join table to outer table
      if (joinOnOuter) {
        related.ownerProp.props.forEach((modelProp, idx) => {
          const rProps = related.joinTableOwnerProp as RelationProperty;
          const joinTableProp = rProps.props[idx];
          const mProp = `"outer".${modelProp}`;
          const jProp = `${joinTable}.${joinTableProp}`;
          this.on(mProp, '=', jProp);
        });
      }
    });

    return query;
  }

  private createMultiThroughMainQuery(
    apiRequest: AbstractApiRequest,
    identifiersByProp: IdentifiersByProp,
  ): QueryInstance {
    // Create query
    let query = this.createMultiThroughSubQuery(apiRequest, false);
    const model = apiRequest.model as any as typeof Model;
    const related = apiRequest.related as Relation;
    const joinTable = related.joinTable as string;
    const joinTableOwnerProp = related.joinTableOwnerProp as RelationProperty;
    const { queryOptions } = apiRequest;
    const geometryAttributes =
      (model as any as typeof Document).geometryAttributes;

    // Attributes to select
    if (queryOptions.attributes) {
      const extras: ao = {};

      (related.joinTableExtras || []).forEach((e) => {
        extras[e.aliasProp] = e.joinTableCol;
      });
      const attrs: (string | Knex.Raw)[] = [];

      for (const a of queryOptions.attributes) {
        // Extras
        if (
          a.startsWith('[[JOIN-TABLE]].')
          && Object.keys(extras).includes(a.slice(15))
        ) {
          attrs.push(`${joinTable}.${extras[a.slice(15)]} AS ${a.slice(15)}`);
          continue;
        }

        // GeoJSON
        if (
          a.startsWith('[[MODEL-TABLE]].')
          && (geometryAttributes || []).includes(a.slice(16))
        ) {
          const snakedA = _.snakeCase(a.slice(16));
          attrs.push(
            st.asGeoJSON(knex.raw(
              `ST_Transform("inner".${snakedA}, 4326)`,
            )).as(a.slice(16)) as any as Knex.Raw,
          );
          continue;
        }

        const attr = a
          .replace('[[MODEL-TABLE]]', 'inner')
          .replace('[[JOIN-TABLE]]', joinTable);
        attrs.push(attr);
      }
      query = query.select(...attrs);
    }

    // Join on outer instances attributes
    const ownerAttributes = joinTableOwnerProp.props
      .map((p, idx) => `${related.joinTable}.${p} AS outerId${idx}`);
    query = query.select(...ownerAttributes);

    // Add relations joins (for filters and eager loading)
    if (queryOptions.relations) {
      query = this.addRelationJoins(apiRequest, query, 'inner');
    }

    // Add full text joins
    if (queryOptions.fullTextJoin) {
      query = this.addFullTextJoins(apiRequest, query);
    }

    // Filters
    if (queryOptions.filters) {
      query = this.setFilters(
        query,
        '$and',
        queryOptions.filters,
        'inner',
        related,
      );
    }

    // Set ordering
    if (queryOptions.order && queryOptions.order.length) {
      queryOptions.order.forEach((order) => {
        const attr = order[0]
          .replace('[[MODEL-TABLE]]', 'inner')
          .replace('[[JOIN-TABLE]]', joinTable);
        query = query.orderBy(attr, order[1]);
      });
    }

    // Set limit
    if (queryOptions.limit) {
      query = query.limit(queryOptions.limit);
    }

    // Set offset
    if (queryOptions.offset) {
      query = query.offset(queryOptions.offset);
    }

    // Filter on outer identifiers
    Object.keys(identifiersByProp).forEach((ownerProp) => {
      // Find the index of ownerProp
      const idx = related.ownerProp.props.indexOf(ownerProp);

      // Map index to same index of join table
      const prop = joinTableOwnerProp.props[idx];

      const identifiers = identifiersByProp[ownerProp];
      if (!identifiers.length) {
        query = query.whereNull(`${related.joinTable}.${prop}`);
      }
      else {
        query = query.whereIn(`${related.joinTable}.${prop}`, identifiers);
      }
    });

    return query;
  }

  private createPaginatedMultiCountQuery(
    apiRequest: AbstractApiRequest,
    identifiersByProp: IdentifiersByProp,
  ): QueryInstance {
    const model = apiRequest.model as any as typeof Model;
    const related = apiRequest.related as Relation;
    const { queryOptions } = apiRequest;

    // Create query
    let query = model.query().alias('inner');

    // Join owner table
    query = query.innerJoin(
      `${related.ownerModelClass.tableName} as "outer"`,
      function joinFn() {
        // Filter from inner table to outer table
        related.ownerProp.props.forEach((modelProp, idx) => {
          const innerProp = related.relatedProp.props[idx];
          const mProp = `"outer"."${modelProp}"`;
          const iProp = `"inner"."${innerProp}"`;
          this.on(mProp, '=', iProp);
        });
      },
    );

    const groupByProps = related.ownerProp.props
      .map((p) => `"outer".${p}`);
    const selectProps = groupByProps
      .map((p, idx) => `${p} AS outerId${idx}`);

    query = query
      .select(
        ...selectProps,
        knex.raw(
          `COUNT(DISTINCT "inner"."${model.idColumn}") AS count`,
        ),
      )
      .groupBy(groupByProps);

    // Add relations joins (for filters and eager loading)
    if (queryOptions.relations) {
      query = this.addRelationJoins(apiRequest, query, 'inner');
    }

    // Add free text joins
    if (queryOptions.fullTextJoin) {
      query = this.addFullTextJoins(apiRequest, query);
    }

    // Filters
    if (queryOptions.filters) {
      query = this.setFilters(
        query,
        '$and',
        queryOptions.filters,
        'inner',
        related,
      );
    }

    // Filter on outer identifiers
    Object.keys(identifiersByProp).forEach((ownerProp) => {
      const identifiers = identifiersByProp[ownerProp];
      if (!identifiers.length) {
        query = query.whereNull(`"outer".${ownerProp}`);
      }
      else {
        query = query.whereIn(`"outer".${ownerProp}`, identifiers);
      }
    });

    return query;
  }

  private createPaginatedMultiMainQuery(
    apiRequest: AbstractApiRequest,
    identifiersByProp: IdentifiersByProp,
  ): QueryInstance {
    const model = apiRequest.model as any as typeof Model;
    const related = apiRequest.related as Relation;
    const { queryOptions } = apiRequest;
    const geometryAttributes =
      (model as any as typeof Document).geometryAttributes;

    // Create sub query
    let subQuery = model.query().alias('inner');

    // Attributes to select
    if (queryOptions.attributes) {
      const attrs: (string | Knex.Raw)[] = [];
      for (const a of queryOptions.attributes) {
        // GeoJSON
        if (
          a.startsWith('[[MODEL-TABLE]].')
          && (geometryAttributes || []).includes(a.slice(16))
        ) {
          const snakedA = _.snakeCase(a.slice(16));
          attrs.push(
            st.asGeoJSON(knex.raw(
              `ST_Transform("inner".${snakedA}, 4326)`,
            )).as(a.slice(16)) as any as Knex.Raw,
          );
          continue;
        }

        attrs.push(`${model.tableName}.${a}`);
      }

      subQuery = subQuery.select(...attrs);
    }

    // Add relations joins (for filters and eager loading)
    if (queryOptions.relations) {
      subQuery = this.addRelationJoins(apiRequest, subQuery, 'inner');
    }

    // Add free text joins
    if (queryOptions.fullTextJoin) {
      subQuery = this.addFullTextJoins(apiRequest, subQuery);
    }

    // Filters
    if (queryOptions.filters) {
      subQuery = this.setFilters(
        subQuery,
        '$and',
        queryOptions.filters,
        'inner',
        related,
      );
    }

    // Filter on ids from outer table
    related.relatedProp.props.forEach((modelProp, idx) => {
      const joinTableProp = related.ownerProp.props[idx];
      const mProp = `"inner"."${_.snakeCase(modelProp)}"`;
      const jProp = `"outer"."${_.snakeCase(joinTableProp)}"`;
      subQuery.whereRaw(`${mProp} = ${jProp}`);
    });

    // Set ordering
    if (queryOptions.order && queryOptions.order.length) {
      queryOptions.order.forEach((order) => {
        const attr = order[0]
          .replace('[[MODEL-TABLE]]', 'inner');
        subQuery = subQuery.orderBy(attr, order[1]);
      });
    }

    // Set limit
    if (queryOptions.limit) {
      subQuery = subQuery.limit(queryOptions.limit);
    }

    // Set offset
    if (queryOptions.offset) {
      subQuery = subQuery.offset(queryOptions.offset);
    }

    // Create primary query
    const ownerAttributes = related.ownerProp.props.map((p, idx) => (
      `"outer"."${p}" AS outerId${idx}`
    ));
    let query = knex.select([...ownerAttributes, `${related.name}.*`]);

    // From
    query = query.from({ outer: related.ownerModelClass.tableName });

    // Join lateral subquery
    query = query.joinRaw(
      `CROSS JOIN LATERAL (?) "${_.snakeCase(related.name)}"`,
      knex.raw(subQuery as any as Knex.Raw),
    );

    // Filter on outer identifiers
    Object.keys(identifiersByProp).forEach((p) => {
      const identifiers = identifiersByProp[p];
      if (!identifiers.length) {
        query = query.whereNull(`outer.${p}`);
      }
      else {
        query = query.whereIn(`outer.${p}`, identifiers);
      }
    });

    return query as any as QueryInstance;
  }

  private addRelationJoins(
    apiRequest: AbstractApiRequest,
    queryInstance: QueryInstance,
    modelAlias: string,
  ): QueryInstance {
    let query = queryInstance;
    const model = apiRequest.model as any as typeof Model;
    const { queryOptions } = apiRequest;

    const relations = model.getRelations();
    queryOptions.relations.forEach((relationOptions) => {
      const { key, type } = relationOptions;
      const relation = relations[key];
      const joinType = type === 'inner' ? 'innerJoin' : 'leftJoin';

      // Join the through table if set
      if (relation.joinTable) {
        query = query[joinType](
          `${relation.joinTable}`,
          function joinFn() {
            // Filter from model table to related table
            relation.ownerProp.props.forEach((modelProp, idx) => {
              const ownerP = relation.joinTableOwnerProp as RelationProperty;
              const joinProp = ownerP.props[idx];
              const mProp = `${modelAlias}."${modelProp}"`;
              const jProp = `${relation.joinTable}."${joinProp}"`;
              this.on(mProp, '=', jProp);
            });
          },
        );
      }

      query = query[joinType](
        `${relation.relatedModelClass.tableName} as ${key}`,
        function joinFn() {
          // Join with the through table if set
          if (relation.joinTable) {
            const joinP = relation.joinTableRelatedProp as RelationProperty;
            joinP.props.forEach((joinProp, idx) => {
              const relatedProp = relation.relatedProp.props[idx];
              const jProp = `${relation.joinTable}."${joinProp}"`;
              const rProp = `${key}."${relatedProp}"`;
              this.on(jProp, '=', rProp);
            });
          }
          // Join from model table to related table
          else {
            relation.ownerProp.props.forEach((modelProp, idx) => {
              const relatedProp = relation.relatedProp.props[idx];
              const mProp = `${modelAlias}."${modelProp}"`;
              const rProp = `${key}."${relatedProp}"`;
              this.on(mProp, '=', rProp);
            });
          }
        },
      );
    });

    return query;
  }

  private addFullTextJoins(
    apiRequest: AbstractApiRequest,
    queryInstance: QueryInstance,
  ): QueryInstance {
    let query = queryInstance;
    const { queryOptions } = apiRequest;
    const { fullTextJoin } = queryOptions;
    if (fullTextJoin) {
      query = query.joinRaw(...fullTextJoin);
    }

    return query;
  }

  private setFilters(
    queryInstance: QueryInstance,
    operator: Operator,
    filters: QueryFilters<QueryFilterOption>,
    modelAlias: string,
    relation?: Relation,
  ): QueryInstance {
    const and = operator === '$and';
    const baseWhere = and ? 'where' : 'orWhere';

    const query = queryInstance[baseWhere](
      (builder: QueryInstance) => {
        filters.forEach((filter) => {
          if (Array.isArray(filter)) {
            const [op, subFilters] = filter;
            builder[baseWhere]((nestedBuilder: QueryInstance) => {
              this.setFilters(nestedBuilder, op, subFilters, modelAlias);
            });
          }
          else {
            const whereType = filter.whereType.replace('where', baseWhere);
            const selfModelRef = whereType.endsWith('Raw')
              ? _.snakeCase(modelAlias)
              : modelAlias;
            let joinModelRef = '';
            if (relation && relation.joinTable) {
              joinModelRef = whereType.endsWith('Raw')
                ? _.snakeCase(relation.joinTable)
                : relation.joinTable;
            }
            const options = filter.options
              .map((o) => (
                typeof o === 'string'
                  ? o
                    .replace('[[MODEL-TABLE]]', selfModelRef)
                    .replace('[[JOIN-TABLE]]', joinModelRef)
                  : o
              ));

            if (!options.length) {
              throw new Error('No options set');
            }

            // TODO(Roar):
            // We need to trick the Typescript compiler a bit here.
            // This part should probably be improved
            builder[whereType as 'where'](...(options as ['string']));
          }
        });
      },
    );

    return query;
  }

  // Find identifiers from outer instances
  private findIdentifiersForThroughRelations(
    related: Relation,
  ): [boolean, IdentifiersByProp] {
    const outerInstances = this.getOuterInstances();
    let identifiersFound = false;
    const identifiersByProp: IdentifiersByProp = {};

    related.ownerProp.props.forEach((ownerTableProp) => {
      identifiersByProp[ownerTableProp] = outerInstances
        .map((i) => (i as ao)[ownerTableProp])
        .filter((i) => i);

      if (identifiersByProp[ownerTableProp].length) {
        identifiersFound = true;
      }
    });

    return [identifiersFound, identifiersByProp];
  }

  private getOuterInstances(): Model[] {
    if (!this.result) {
      return [];
    }
    if (Array.isArray(this.result)) {
      return this.result;
    }
    return this.result.rows;
  }

  private formatRows(
    apiRequest: AbstractApiRequest,
    rows: Model[],
  ): ao[] {
    let documents: ao[] = [];

    for (const row of rows) {
      const document = row.$toJson() as ao;

      // Only return requested fields
      Object.keys(document).forEach((key) => {
        if (
          key !== 'fullTextRank'
          && !apiRequest.requestedFields.includes(key)
          && !apiRequest.requestedRelations.includes(key)
        ) {
          delete document[key];
        }
      });

      // Process includes
      Object.keys(apiRequest.relationRequests).forEach((relationKey) => {
        if ((row as ao)[relationKey]) {
          const nextApiRequest = apiRequest.relationRequests[relationKey];
          if (Array.isArray(document[relationKey])) {
            document[relationKey] = this.formatRows(
              nextApiRequest,
              document[relationKey],
            );
          }
          else if (document[relationKey] && document[relationKey].rows) {
            document[relationKey].rows = this.formatRows(
              nextApiRequest,
              document[relationKey].rows,
            );
          }
        }
      });

      documents.push(document as Model);
    }

    // Remove null values
    documents = documents.map((doc) => this.formatDocument(doc));

    // Fix geojson fields
    if (apiRequest.model.geometryAttributes) {
      documents = documents.map((doc) => {
        apiRequest.model.geometryAttributes.forEach((geoField) => {
          const casedGeoField = _.snakeCase(geoField);
          if (doc[casedGeoField] && typeof doc[casedGeoField] === 'string') {
            doc[casedGeoField] = JSON.parse(doc[casedGeoField]);
          }
        });
        return doc;
      });
    }

    return documents;
  }

  private formatDocument(document: ao) {
    const res: ao = {};

    Object.keys(document).forEach((key) => {
      let ref = document[key];

      if (isObject(ref) && Object.keys(ref).length) {
        ref = this.formatDocument(ref);
      }

      // Remove attributes with empty or null values
      if (
        (!isObject(ref) || Object.keys(ref).length)
        && (!Array.isArray(ref) || ref.length)
        && ref !== null
        && ref !== undefined
      ) {
        res[_.snakeCase(key)] = ref;
      }
    });

    return res;
  }
}

export default DbQuery;
