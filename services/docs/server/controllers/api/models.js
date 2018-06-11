import { Router } from 'express';

import * as models from '@turistforeningen/ntb-shared-models';


const router = new Router();
const { BelongsToOneRelation } = models.BaseModel;


router.get('/', (req, res, next) => {
  const data = {};

  Object.values(models)
    .filter((model) => model.APIEntryModel)
    .forEach((model) => {
      const relations = {};
      Object.keys(model.relationMappings).forEach((relationKey) => {
        const relation = model.relationMappings[relationKey];
        relations[relationKey] = {
          model: relation.modelClass,
          belongsToOneRelation: relation.relation === BelongsToOneRelation,
        };

        const { join } = relation;
        if (join && join.through && join.through.extra) {
          const extra = Object.keys(join.through.extra);
          if (extra.length) {
            relations[relationKey].extra = extra;
          }
        }
      });

      data[model.name] = {
        relations,
        idColumn: model.idColumn,
        config: model.getAPIConfig(),
        schema: model.jsonSchema,
      };
    });

  res.json({ models: data });
});


module.exports = router;
