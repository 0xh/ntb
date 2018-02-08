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

  CountyTranslation.associate = (models) => {
    models.CountyTranslation.belongsTo(models.County);
  };


  // HOOKS

  CountyTranslation.hook('beforeSave', (instance) => {
    instance.nameLowercase = instance.name.toLowerCase();
  });


  return CountyTranslation;
};
