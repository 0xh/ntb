export default (sequelize, DataTypes) => {
  const AreaToCounty = sequelize.define('AreaToCounty', {
    areaUuid: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    countyUuid: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    dataSource: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
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
