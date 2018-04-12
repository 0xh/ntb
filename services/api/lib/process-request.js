import db from '@turistforeningen/ntb-shared-models';
import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


function getModelAPIConfig(model, referrer) {
  const modelApiConfig = model.getAPIConfig(db);
  let queryConfig = null;

  // If config for complete referrer chain is set
  if (modelApiConfig.byReferrer[referrer]) {
    queryConfig = modelApiConfig.byReferrer[referrer];
  }

  // If no config is found, try default config
  if (!queryConfig && modelApiConfig.byReferrer.default) {
    queryConfig = modelApiConfig.byReferrer.default;
  }

  // Throw error if no configuration is found
  if (!queryConfig) {
    throw new Error(
      `Unable to get correct configuration for ${model.name}` +
      `byReferrer ${referrer}`
    );
  }

  return {
    modelApiConfig,
    queryConfig,
  };
}


function processModelConfig(model, referrer) {
  const { modelApiConfig, queryConfig } = getModelAPIConfig(model, referrer);
  const attributes = model.fieldsToAttributes(queryConfig.fields);

  const queryOptions = {
    limit: queryConfig.limit || 10,
    offset: 0,
    order: queryConfig.order || [['updatedAt', 'DESC']],
    attributes,

    logging: (sql, duration, options) => {
      logger.debug(sql);
      logger.debug(JSON.stringify(options));
    },
  };

  return queryOptions;
}


export default async function (requestParameters, entryModel) {
  const queryOptions = processModelConfig(entryModel, '*onEntry');

  const data = await entryModel.findAll(queryOptions);

  // .then((areas) => {
  //   const result = {
  //     areas: areas.map((area) => db.Area.format(area)),
  //   };

  //   res.json(result);
  // });

  return { test: 1 };
}
