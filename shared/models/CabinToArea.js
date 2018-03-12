export default (sequelize, DataTypes) => {
  const CabinToArea = sequelize.define('CabinToArea', {
    cabinUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    areaUuid: {
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
  CabinToArea.removeAttribute('id');


  // Associations

  CabinToArea.associate = (models) => {
    models.CabinToArea.belongsTo(models.Cabin, {
      as: 'Cabin',
      foreignKey: 'cabinUuid',
    });

    models.CabinToArea.belongsTo(models.Area, {
      as: 'Area',
      foreignKey: 'areaUuid',
    });
  };

  return CabinToArea;
};
