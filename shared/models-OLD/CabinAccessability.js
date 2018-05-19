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

  CabinAccessability.getAPIThroughFields = (sourceModelName) => {
    if (sourceModelName === 'Accessability') {
      return {
        accessabilityDescription: true,
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

  CabinAccessability.fieldsToAttributes = (sourceModelName, fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (`${sourceModelName}.${field}`) {
        case 'Accessability.name':
        case 'Cabin.name':
          return 'accessabilityName';
        case 'Accessability.accessabilityDescription':
          return 'description';
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
    if (this._sourceModelName === 'Accessability') {
      const formattedCabin = this.Cabin.format();
      return {
        ...formattedCabin,
        accessabilityDescription: this.description && this.description.length
          ? this.description
          : null,
      };
    }
    else if (this._sourceModelName === 'Cabin') {
      const formattedAccessability = this.Accessability.format();
      return {
        ...formattedAccessability,
        description: this.description && this.description.length
          ? this.description
          : null,
      };
    }

    throw new Error(`Unknown source model name: ${this._sourceModelName}`);
  };

  return CabinAccessability;
};
