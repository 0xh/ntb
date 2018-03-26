export default (sequelize, DataTypes) => {
  const Uuid = sequelize.define('Uuid', {
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    documentType: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
  }, {
    timestamps: false,
  });

  // Primary key for this table is created manually in migration 01
  Uuid.removeAttribute('id');

  return Uuid;
};
