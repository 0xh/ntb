export default (sequelize, DataTypes) => {
  const attributeConfig = {
    name: { type: DataTypes.TEXT, primaryKey: true },
    description: { type: DataTypes.TEXT },
  };

  const modelConfig = {
    timestamps: false,
  };

  const Facility = sequelize.define('Facility', attributeConfig, modelConfig);


  // Associations

  Facility.associate = (models) => {
    models.Facility.belongsToMany(models.Cabin, {
      through: {
        model: models.CabinFacility,
      },
      as: 'Cabins',
      foreignKey: 'facilityName',
      otherKey: 'cabinUuid',
    });
  };


  // API CONFIGURATION

  Facility.APIEntryModel = true;

  Facility.getAPIConfig = (models) => {
    const config = { byReferrer: {} };

    // Configuration when it's the entry model
    config.byReferrer.default = {
      paginate: false,
      fullTextSearch: false,
      ordering: true,
      defaultOrder: [['name', 'ASC']],
      validOrderFields: ['name'],
      // validFields - true/false if they should be returned from API as
      // default if no ?fields=.. parameter is specified
      validFields: {
        name: true,
        internalDescription: false,
      },
      include: {
        cabins: {
          includeByDefault: false,
          association: 'Cabins',
        },
      },
    };

    return config;
  };

  Facility.fieldsToAttributes = (fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'internalDescription':
          return ['description'];
        default:
          if (Object.keys(attributeConfig).includes(field)) {
            return [field];
          }
          throw new Error(`Unable to translate field ${field} on Cabin model`);
      }
    }).filter((field) => field !== null));

    return attributes;
  };


  Facility.prototype.format = function format() {
    return {
      name: this.name,
      internalDescription: this.description && this.description.length
        ? this.description
        : null,
    };
  };

  return Facility;
};
