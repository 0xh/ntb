export default (sequelize, DataTypes) => {
  const AreaToMunicipality = sequelize.define('AreaToMunicipality', {
    areaUuid: {
      type: DataTypes.UUID,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },
    municipalityUuid: {
      type: DataTypes.UUID,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },
    dataSource: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  // Primary key for this table is created manually in migration 01
  AreaToMunicipality.removeAttribute('id');


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
