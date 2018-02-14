export default (sequelize, DataTypes) => {
  const TagRelation = sequelize.define('TagRelation', {
    tagName: {
      type: DataTypes.TEXT,
      // Composite primaryKey defined in migration 01
    },
    taggedType: {
      type: DataTypes.TEXT,
      // Composite primaryKey defined in migration 01
    },
    taggedUuid: {
      type: DataTypes.UUID,
      // Composite primaryKey defined in migration 01
    },
    dataSource: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: false,
  });

  // Primary key for this table is created manually in migration 01
  TagRelation.removeAttribute('id');

  return TagRelation;
};
