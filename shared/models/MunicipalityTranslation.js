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
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },

    nameLowercase: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },

    language: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },

    dataSource: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['nameLowercase'],
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
    instance.nameLowercase = instance.name.toLowerCase();
  });


  return MunicipalityTranslation;
};
