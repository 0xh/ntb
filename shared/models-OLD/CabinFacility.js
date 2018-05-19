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


  // Associations

  CabinFacility.associate = (models) => {
    models.CabinFacility.belongsTo(models.Cabin, {
      as: 'Cabin',
      foreignKey: 'cabinUuid',
    });

    models.CabinFacility.belongsTo(models.Facility, {
      as: 'Facility',
      foreignKey: 'facilityName',
    });
  };


  // API CONFIGURATION

  CabinFacility.getAPIThroughFields = (sourceModelName) => {
    if (sourceModelName === 'Facility') {
      return {
        facilityDescription: true,
      };
    }
    else if (sourceModelName === 'Cabin') {
      return {
        name: true,
        description: true,
      };
    }

    throw new Error(`Unknown source model name: ${sourceModelName}`);
  };


  CabinFacility.fieldsToAttributes = (sourceModelName, fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (`${sourceModelName}.${field}`) {
        case 'Cabin.name':
          return 'facilityName';
        case 'Facility.facilityDescription':
          return 'description';
        default:
          if (Object.keys(attributeConfig).includes(field)) {
            return [field];
          }
          throw new Error(
            `Unable to translate field ${field} on CabinFacility model`
          );
      }
    }).filter((field) => field !== null));

    return attributes;
  };


  CabinFacility.prototype.format = function format() {
    if (this._sourceModelName === 'Facility') {
      const formattedCabin = this.Cabin.format();
      return {
        ...formattedCabin,
        facilityDescription: this.description && this.description.length
          ? this.description
          : null,
      };
    }
    else if (this._sourceModelName === 'Cabin') {
      const formattedFacility = this.Facility.format();
      return {
        ...formattedFacility,
        description: this.description && this.description.length
          ? this.description
          : null,
      };
    }

    throw new Error(`Unknown source model name: ${this._sourceModelName}`);
  };

  return CabinFacility;
};
