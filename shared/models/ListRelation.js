export default (sequelize, DataTypes) => {
  const ListRelation = sequelize.define('ListRelation', {
    listUuid: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    documentType: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    documentUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },

    sortIndex: { type: DataTypes.INTEGER },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  // Primary key for this table is created manually in migration 01
  ListRelation.removeAttribute('id');


  return ListRelation;
};
