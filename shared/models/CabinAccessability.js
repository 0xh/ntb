export default (sequelize, DataTypes) => {
  const attributeConfig = {
    accessabilityName: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    cabinUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    description: { type: DataTypes.TEXT },

    dataSource: { type: DataTypes.TEXT },
  };

  const modelConfig = {
    timestamps: false,
  };

  const CabinAccessability = sequelize.define(
    'CabinAccessability', attributeConfig, modelConfig
  );


  // Associations

  CabinAccessability.associate = (models) => {
    models.CabinAccessability.belongsTo(models.Cabin, {
      as: 'Cabin',
      foreignKey: 'cabinUuid',
    });

    models.CabinAccessability.belongsTo(models.Accessability, {
      as: 'Accessability',
      foreignKey: 'accessabilityName',
    });
  };


  // API CONFIGURATION

  CabinAccessability.getAPIConfig = (models) => {
    const config = { byReferrer: {} };

    // Configuration when it's the entry model
    config.byReferrer.default = {
      paginate: false,
      fullTextSearch: false,
      ordering: false,
      defaultOrder: [['accessabilityName', 'ASC']],
      validOrderFields: ['accessabilityName'],
      // validFields - true/false if they should be returned from API as
      // default if no ?fields=.. parameter is specified
      validFields: {
        name: true,
        cabinUuid: false,
        description: true,
        updatedAt: false,
        createdAt: false,
      },
    };

    return config;
  };

  CabinAccessability.fieldsToAttributes = (fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'name':
          return 'accessabilityName';
        case 'createdAt':
        case 'updatedAt':
          if (modelConfig.timestamps) {
            return [field];
          }
          throw new Error(
            `Unable to translate field ${field} on CabinAccessability model`
          );
        default:
          if (Object.keys(attributeConfig).includes(field)) {
            return [field];
          }
          throw new Error(
            `Unable to translate field ${field} on CabinAccessability model`
          );
      }
    }).filter((field) => field !== null));

    return attributes;
  };


  CabinAccessability.prototype.format = function format() {
    return {
      name: this.accessabilityName,
      cabinUuid: this.cabinUuid,
      description: this.description && this.description.length
        ? this.description
        : null,
    };
  };

  return CabinAccessability;
};
