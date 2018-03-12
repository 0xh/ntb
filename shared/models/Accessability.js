export default (sequelize, DataTypes) => {
  const Accessability = sequelize.define('Accessability', {
    nameLowerCase: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
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
  };


  // HOOKS

  Accessability.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Accessability;
};
