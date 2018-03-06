export default (sequelize, DataTypes) => {
  const AreaToArea = sequelize.define('AreaToArea', {
    parentUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    childUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });

  // Primary key for this table is created manually in migration 01
  AreaToArea.removeAttribute('id');


  // Associations

  AreaToArea.associate = (models) => {
    models.AreaToArea.belongsTo(models.Area, {
      as: 'Parent',
      foreignKey: 'parentUuid',
    });

    models.AreaToArea.belongsTo(models.Area, {
      as: 'Child',
      foreignKey: 'childUuid',
    });
  };

  return AreaToArea;
};
