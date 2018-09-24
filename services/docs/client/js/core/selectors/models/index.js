import { createSelector } from 'reselect';


export const getIsFetching = (state) => state['core/models'].fetching;


export const getFetchError = (state) => state['core/models'].fetchError;


export const getFetchTimestamp = (state) =>
  state['core/models'].fetchTimestamp;


export const getModels = (state) => state['core/models'].data;


export const getModelNames = createSelector(
  getModels,
  (models, onlyEntryModels) => Object.keys(models || {})
);


export const getModelConfig = (state, modelName) => {
  const models = getModels(state);
  return models[modelName] && models[modelName].config
    ? models[modelName].config
    : null;
};


export const getModelRelations = (state, modelName) =>
  getModels(state)[modelName].relations;


export const getModelRelationNames = (state, modelName) =>
  Object.keys(getModels(state)[modelName].relations);


export const getModelIdColumn = (state, modelName) =>
  getModels(state)[modelName].idColumn;


export const getModelDescription = (state, modelName) =>
  getModels(state)[modelName].modelDescription;


export const getModelIsEntry = (state, modelName) =>
  getModels(state)[modelName].apiEntryModel;


export const getEntryModelNames = (state) => (
  Object.keys(getModels(state)).filter(
    (n) => getModels(state)[n].apiEntryModel
  )
);


export const getModelSchema = (state, modelName) =>
  getModels(state)[modelName].schema;


export const getModelConfigByReferrers = (
  state,
  modelName,
  referrers,
) => {
  const modelConfig = getModelConfig(state, modelName);
  if (!modelConfig) {
    return null;
  }

  let config;

  referrers.forEach((ref) => {
    if (!config && modelConfig[ref]) {
      config = modelConfig[ref];
    }
  });

  if (!config) {
    config = modelConfig.standard;
  }

  return config;
};


export const getRelationFilters = (
  state,
  modelName,
) => {
  const relations = getModelRelations(state, modelName);

  if (!relations || !Object.keys(relations).length) {
    return null;
  }

  const filters = {};

  Object.keys(relations).forEach((relationName) => {
    const relation = relations[relationName];
    const relationNameKey = relation.model;
    const referrers = [`${modelName}.${relationName}`];
    const config = getModelConfigByReferrers(
      state, relationNameKey, referrers
    );

    if (config && config.filters) {
      filters[relationName] = config.filters;
    }
  });

  return Object.keys(filters) ? filters : null;
};
