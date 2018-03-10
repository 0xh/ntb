export default (sequelize, DataTypes) => {
  const CabinTranslation = sequelize.define('CabinTranslation', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    cabinUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: 'county_language',
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

    description: { type: DataTypes.TEXT },
    descriptionPlain: { type: DataTypes.TEXT },

    language: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: 'county_language',
      validate: {
        notEmpty: true,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  CabinTranslation.associate = (models) => {
    models.CabinTranslation.belongsTo(models.Cabin, {
      as: 'Cabin',
      foreignKey: 'cabinUuid',
    });
  };


  // HOOKS

  CabinTranslation.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });


  return CabinTranslation;
};
