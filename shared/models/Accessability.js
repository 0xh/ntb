export default (sequelize, DataTypes) => {
  const attributeConfig = {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
  };

  const modelConfig = {
    timestamps: false,
  };

  const Accessability = sequelize.define(
    'Accessability', attributeConfig, modelConfig
  );


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


  // API CONFIGURATION

  Accessability.APIEntryModel = true;

  Accessability.getAPIConfig = (models) => {
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
      },
      include: {
        // TODO(roar):
        // pois

        cabins: {
          includeByDefault: false,
          association: 'Cabins',
        },
      },
    };

    return config;
  };

  Accessability.fieldsToAttributes = (fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        default:
          if (Object.keys(attributeConfig).includes(field)) {
            return [field];
          }
          throw new Error(
            `Unable to translate field ${field} on Accessability model`
          );
      }
    }).filter((field) => field !== null));

    return attributes;
  };


  Accessability.prototype.format = function format() {
    return {
      name: this.name,
      description: this.description && this.description.length
        ? this.description
        : null,
    };
  };

  return Accessability;
};
