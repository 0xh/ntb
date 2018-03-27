export default (sequelize, DataTypes) => {
  const AreaToMunicipality = sequelize.define('AreaToMunicipality', {
    areaUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    municipalityUuid: {
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
