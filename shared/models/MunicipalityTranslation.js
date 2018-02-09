export default (sequelize, DataTypes) => {
  const MunicipalityTranslation = sequelize.define('MunicipalityTranslation', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
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
    indexes: [
      {
        fields: ['municipalityUuid', 'language'],
        unique: true,
      },
      {
        fields: ['nameLowerCase'],
      },
      {
        fields: ['dataSource'],
      },
    ],
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
