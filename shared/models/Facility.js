export default (sequelize, DataTypes) => {
  const Facility = sequelize.define('Facility', {
    name: { type: DataTypes.TEXT, primaryKey: true },
    description: { type: DataTypes.TEXT },
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
