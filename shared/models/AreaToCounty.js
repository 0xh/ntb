export default (sequelize, DataTypes) => {
  const AreaToCounty = sequelize.define('AreaToCounty', {
    areaUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    countyUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  AreaToCounty.associate = (models) => {
    models.AreaToCounty.belongsTo(models.Area, {
      as: 'Area',
      foreignKey: 'areaUuid',
    });

    models.AreaToCounty.belongsTo(models.County, {
      as: 'County',
      foreignKey: 'countyUuid',
    });
  };

  return AreaToCounty;
};
