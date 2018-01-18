'use strict';

module.exports = (legacyStatus) => {
  const status = legacyStatus.toLowerCase();

  switch (status) {
    case 'kladd':
      return 'draft';
    case 'offentlig':
      return 'public';
    case 'Slettet':
      return 'public';
    // Set as private. This will include the actual 'Privat' status from the
    // legacy api
    default:
      return 'private';
  }
};
