export default (sequelize, DataTypes) => {
  const AreaToMunicipality = sequelize.define('AreaToMunicipality', {
    areaUuid: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    municipalityUuid: {
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

  AreaToMunicipality.associate = (models) => {
    models.AreaToMunicipality.belongsTo(models.Area, {
      as: 'Area',
      foreignKey: 'areaUuid',
    });

    models.AreaToMunicipality.belongsTo(models.Municipality, {
      as: 'Municipality',
      foreignKey: 'municipalityUuid',
    });
  };

  return AreaToMunicipality;
};
