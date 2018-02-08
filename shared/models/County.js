export default (sequelize, DataTypes) => {
  const County = sequelize.define('County', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
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

    nameLowerCase: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },

    status: {
      type: DataTypes.ENUM,
      values: ['draft', 'public', 'deleted', 'private'],
    },

    dataSource: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['nameLowerCase'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['dataSource'],
      },
    ],
  });


  // Associations

  County.associate = (models) => {
    models.County.hasMany(models.CountyTranslation, {
      as: 'Translation',
    });
  };


  // HOOKS

  County.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return County;
};
