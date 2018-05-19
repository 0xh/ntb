export default (sequelize, DataTypes) => {
  const MunicipalityTranslation = sequelize.define('MunicipalityTranslation', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    municipalityUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: 'municipality_language',
    },

    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    nameLowerCase: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    language: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: 'municipality_language',
      validate: {
        notEmpty: true,
      },
    },

    dataSource: { type: DataTypes.TEXT },
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
