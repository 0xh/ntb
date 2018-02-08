export default (sequelize, DataTypes) => {
  const Municipality = sequelize.define('Municipality', {
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

  Municipality.associate = (models) => {
    models.Municipality.belongsTo(models.County);

    models.Municipality.hasMany(models.MunicipalityTranslation, {
      as: 'Translation',
    });
  };


  // HOOKS

  Municipality.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Municipality;
};
