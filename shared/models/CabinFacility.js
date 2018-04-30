export default (sequelize, DataTypes) => {
  const attributeConfig = {
    facilityName: {
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

  const CabinFacility = sequelize.define(
    'CabinFacility',
    attributeConfig,
    modelConfig
  );


  // API CONFIGURATION

  CabinFacility.getAPIConfig = (models) => {
    const config = { byReferrer: {} };

    // Configuration when it's the entry model
    config.byReferrer.default = {
      paginate: true,
      fullTextSearch: false,
      ordering: false,
      defaultOrder: [['facilityName', 'ASC']],
      defaultLimit: 1,
      maxLimit: 50,
      validOrderFields: ['facilityName'],
      // validFields - true/false if they should be returned from API as
      // default if no ?fields=.. parameter is specified
      validFields: {
        name: true,
        cabinUuid: false,
        description: true,
        updatedAt: false,
        createdAt: false,
      },
      include: {
        // TODO(Roar):
        // cabins
      },
    };

    return config;
  };

  CabinFacility.fieldsToAttributes = (fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'name':
          return 'facilityName';
        case 'createdAt':
        case 'updatedAt':
          if (modelConfig.timestamps) {
            return [field];
          }
          throw new Error(`Unable to translate field ${field} on Cabin model`);
        default:
          if (Object.keys(attributeConfig).includes(field)) {
            return [field];
          }
          throw new Error(`Unable to translate field ${field} on Cabin model`);
      }
    }).filter((field) => field !== null));

    return attributes;
  };


  CabinFacility.prototype.format = function format() {
    return {
      name: this.facilityName,
      cabinUuid: this.cabinUuid,
      description: this.description && this.description.length
        ? this.description
        : null,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
  };

  return CabinFacility;
};
