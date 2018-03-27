export default (sequelize, DataTypes) => {
  const Accessability = sequelize.define('Accessability', {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
  }, {
    timestamps: false,
  });


  // Associations

  Accessability.associate = (models) => {
    models.Accessability.belongsToMany(models.Cabin, {
      through: {
        model: models.CabinAccessability,
      },
      as: 'Cabins',
      foreignKey: 'accessabilityName',
    });

    models.Accessability.belongsToMany(models.Poi, {
      through: {
        model: models.PoiAccessability,
      },
      as: 'Pois',
      foreignKey: 'accessabilityName',
    });
  };


  // HOOKS

  Accessability.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Accessability;
};
