export default (legacyStatus) => {
  const status = legacyStatus.toLowerCase();

  switch (status) {
    case 'kladd':
      return 'draft';
    case 'offentlig':
      return 'public';
    case 'Slettet':
      return 'deleted';
    // Set as private. This will include the actual 'Privat' status from the
    // legacy api
    default:
      return 'private';
  }
};
