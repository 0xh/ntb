import { Router } from 'express';

import * as models from '@ntb/models';


const router = new Router();
const { BelongsToOneRelation } = models.Document;


router.get('/', (req, res, next) => {
  const data = {};

  Object.values(models)
    .filter((model) => model.apiEntryModel)
    .forEach((model) => {
      const relations = {};
      Object.keys(model.relationMappings || {}).forEach((relationKey) => {
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

      let { modelDescription } = model;
      if (modelDescription) {
        modelDescription = modelDescription.trim();
        while (modelDescription.indexOf('\n ') !== -1) {
          modelDescription = modelDescription.replace('\n ', '\n');
        }
      }

      data[model.name] = {
        relations,
        idColumn: model.idColumn,
        config: model.getApiConfigPerReferrer(),
        schema: model.jsonSchema,
        modelDescription: modelDescription || null,
      };
    });

  res.json({ models: data });
});


module.exports = router;
