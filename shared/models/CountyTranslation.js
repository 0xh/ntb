export default (sequelize, DataTypes) => {
  const CountyTranslation = sequelize.define('CountyTranslation', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    countyUuid: {
      type: DataTypes.UUID,
      unique: 'county_language',
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
      unique: 'county_language',
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

  CountyTranslation.associate = (models) => {
    models.CountyTranslation.belongsTo(models.County);
  };


  // HOOKS

  CountyTranslation.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });


  return CountyTranslation;
};
