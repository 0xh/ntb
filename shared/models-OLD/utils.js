export function disableAllFields(config, key = '*list') {
  return Object.assign(
    {},
    ...(
      Object.keys(config.byReferrer[key].validFields)
        .map((f) => ({
          [f]: false,
        }))
    )
  );
}


export function disableAllIncludes(config, key = '*list') {
  return Object.assign(
    {},
    ...(
      Object.keys(config.byReferrer[key].include)
        .map((k) => ({
          [k]: {
            ...config.byReferrer[key].include[k],
            includeByDefault: false,
          },
        }))
    )
  );
}
