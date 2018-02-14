export default (sequelize, DataTypes) => {
  const MunicipalityTranslation = sequelize.define('MunicipalityTranslation', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    municipalityUuid: {
      type: DataTypes.UUID,
      unique: 'municipality_language',
    },

    name: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: true,
      },
    },

    nameLowerCase: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: true,
      },
    },

    language: {
      type: DataTypes.TEXT,
      unique: 'municipality_language',
      validate: {
        notEmpty: true,
      },
    },

    dataSource: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });


  // Associations

  MunicipalityTranslation.associate = (models) => {
    models.MunicipalityTranslation.belongsTo(models.Municipality);
  };


  // HOOKS

  MunicipalityTranslation.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });


  return MunicipalityTranslation;
};
