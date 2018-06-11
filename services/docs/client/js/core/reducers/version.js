const version = (
  state = { apiVersion: 'unset', appVersion: 'unset' },
  action
) => {
  if (action.payload && action.payload.HEADER_OPTS) {
    return {
      apiVersion: action.payload.HEADER_OPTS.apiVersion || 'unknown',
      appVersion: action.payload.HEADER_OPTS.appVersion || 'unknown',
    };
  }
  return state;
};


export default version;
