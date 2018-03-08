export default (sequelize, DataTypes) => {
  const Cabin = sequelize.define('Cabin', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtb: { type: DataTypes.TEXT },

    dntCabin: { type: DataTypes.BOOLEAN, default: false, allowNull: false },
    dntDiscount: { type: DataTypes.BOOLEAN, default: false, allowNull: false },

    maintainerGroupUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: 4,
      },
    },

    ownerGroupUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: 4,
      },
    },

    contactGroupUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: 4,
      },
    },

    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    nameLowerCase: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    nameAlt: { type: DataTypes.TEXT },
    nameAltLowerCase: { type: DataTypes.TEXT },

    description: { type: DataTypes.TEXT },
    descriptionPlain: { type: DataTypes.TEXT },

    contactName: { type: DataTypes.TEXT },
    email: { type: DataTypes.TEXT },
    phone: { type: DataTypes.TEXT },
    mobile: { type: DataTypes.TEXT },
    fax: { type: DataTypes.TEXT },
    address1: { type: DataTypes.TEXT },
    address2: { type: DataTypes.TEXT },
    postalCode: { type: DataTypes.TEXT },
    postalName: { type: DataTypes.TEXT },

    url: { type: DataTypes.TEXT },

    yearOfConstruction: { type: DataTypes.INTEGER },

    geojson: { type: DataTypes.GEOMETRY },

    countyUuid: {
      type: DataTypes.UUID,
      validate: {
        isUUID: 4,
      },
    },

    municipalityUuid: {
      type: DataTypes.UUID,
      validate: {
        isUUID: 4,
      },
    },

    serviceLevel: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: [
        'self service',
        'serviced',
        'unmanned',
        'closed',
        'dining',
        'unmanned (no beds)',
        'emergency shelter',
      ],
    },

    bedsExtra: { type: DataTypes.INTEGER },
    bedsServiced: { type: DataTypes.INTEGER },
    bedsSelfService: { type: DataTypes.INTEGER },
    bedsUnmanned: { type: DataTypes.INTEGER },
    bedsWinter: { type: DataTypes.INTEGER },

    bookingEnabled: { type: DataTypes.BOOLEAN },
    bookingOnly: { type: DataTypes.BOOLEAN },
    bookingUrl: { type: DataTypes.TEXT },

    htgtWinter: { type: DataTypes.TEXT },
    htgtSummer: { type: DataTypes.TEXT },
    htgtOtherWinter: { type: DataTypes.TEXT },
    htgtOtherSummer: { type: DataTypes.TEXT },

    map: { type: DataTypes.TEXT },
    mapAlt: { type: DataTypes.ARRAY(DataTypes.TEXT) },

    license: { type: DataTypes.TEXT },

    provider: { type: DataTypes.TEXT },

    status: {
      type: DataTypes.ENUM,
      values: ['draft', 'public', 'deleted', 'private'],
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  Cabin.associate = (models) => {
    models.Cabin.belongsTo(models.Group, {
      as: 'MaintainerGroup',
      foreignKey: 'maintainerGroupUuid',
    });

    models.Cabin.belongsTo(models.Group, {
      as: 'OwnerGroup',
      foreignKey: 'ownerGroupUuid',
    });

    models.Cabin.belongsTo(models.Group, {
      as: 'ContactGroup',
      foreignKey: 'contactGroupUuid',
    });

    models.Cabin.belongsTo(models.County, {
      foreignKey: 'countyUuid',
    });

    models.Cabin.belongsTo(models.Municipality, {
      foreignKey: 'municipalityUuid',
    });
  };


  // HOOKS

  Cabin.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Cabin;
};
