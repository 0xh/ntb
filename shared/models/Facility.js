export default (sequelize, DataTypes) => {
  const Facility = sequelize.define('Facility', {
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

  Facility.associate = (models) => {
    models.Facility.belongsToMany(models.Cabin, {
      through: {
        model: models.CabinFacility,
      },
      as: 'Cabins',
      foreignKey: 'facilityName',
    });
  };


  // HOOKS

  Facility.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Facility;
};
