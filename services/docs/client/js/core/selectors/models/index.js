import { createSelector } from 'reselect';


export const getIsFetching = (state) => state['core/models'].fetching;


export const getFetchError = (state) => state['core/models'].fetchError;


export const getFetchTimestamp = (state) =>
  state['core/models'].fetchTimestamp;


export const getModels = (state) => state['core/models'].data;


export const getModelNames = createSelector(
  getModels,
  (models) => Object.keys(models || {})
);


export const getModelConfig = (state, modelName) =>
  getModels(state)[modelName].config;


export const getModelRelations = (state, modelName) =>
  getModels(state)[modelName].relations;


export const getModelIdColumn = (state, modelName) =>
  getModels(state)[modelName].idColumn;


export const getModelSchema = (state, modelName) =>
  getModels(state)[modelName].schema;


export const getModelConfigByReferrer = (
  state,
  modelName,
  referrer,
) => {
  const modelConfig = getModelConfig(state, modelName);
  let config;

  referrer.forEach((ref) => {
    if (!config && modelConfig[ref]) {
      config = modelConfig[ref];
    }
  });

  if (!config) {
    config = modelConfig.default;
  }

  return config;
};
