import Document, { ApiConfig } from '@ntb/models/Document';
import { _ } from '@ntb/utils';
import {
  Model,
  st,
  knex,
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


type QueryInstance = QueryBuilder<Model, Model[], Model[]>;


class DbQuery {
  result?: DbQueryResult;

  model: typeof Model;
  joinModel?: typeof Model;
  apiConfig: ApiConfig;
  queryOptions: QueryOptions;

  constructor(
    model: typeof Document,
    apiConfig: ApiConfig,
    queryOptions: QueryOptions,
    joinModel?: typeof Document,
  ) {
    this.model = model as any as typeof Model;
    this.apiConfig = apiConfig;
    this.queryOptions = queryOptions;
    this.joinModel = joinModel ? joinModel as any as typeof Model : undefined;
  }

  async execute() {
    await this.processMainQuery();
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
      query = this.addRelationJoins(query, this.model.tableName);
    }

    // Add full text joins
    if (this.queryOptions.fullTextJoin) {
      query = this.addFullTextJoins(query);
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

  private addRelationJoins(queryInstance: QueryInstance, modelAlias: string) {
    let query = queryInstance;
    const relations = this.model.getRelations();
    this.queryOptions.relations.forEach((relationOptions) => {
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

  private addFullTextJoins(queryInstance: QueryInstance) {
    let query = queryInstance;
    const { fullTextJoin } = this.queryOptions;
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
  ) {
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
}

export default DbQuery;
