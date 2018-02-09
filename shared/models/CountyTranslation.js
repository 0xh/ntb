export default (sequelize, DataTypes) => {
  const CountyTranslation = sequelize.define('CountyTranslation', {
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
        fields: ['countyUuid', 'language'],
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

  CountyTranslation.associate = (models) => {
    models.CountyTranslation.belongsTo(models.County);
  };


  // HOOKS

  CountyTranslation.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });


  return CountyTranslation;
};
