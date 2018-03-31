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

    code: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
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

    status: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['draft', 'public', 'deleted', 'private'],
    },

    dataSource: { type: DataTypes.TEXT },
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
      as: 'Translations',
    });

    models.Municipality.belongsToMany(models.Area, {
      as: 'Areas',
      through: models.AreaToMunicipality,
      foreignKey: 'municipalityUuid',
    });

    models.Municipality.belongsToMany(models.List, {
      as: 'Lists',
      through: models.ListToMunicipality,
      foreignKey: 'municipalityUuid',
    });
  };


  // HOOKS

  Municipality.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Municipality;
};
