export default (sequelize, DataTypes) => {
  const attributeConfig = {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtb: { type: DataTypes.TEXT, unique: true },
    idSsr: { type: DataTypes.TEXT },

    dntCabin: { type: DataTypes.BOOLEAN, default: false, allowNull: false },
    dntDiscount: { type: DataTypes.BOOLEAN, default: false, allowNull: false },

    maintainerGroupUuid: {
      type: DataTypes.UUID,
      validate: {
        isUUID: 4,
      },
    },

    ownerGroupUuid: {
      type: DataTypes.UUID,
      validate: {
        isUUID: 4,
      },
    },

    contactGroupUuid: {
      type: DataTypes.UUID,
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

    nameAlt: { type: DataTypes.ARRAY(DataTypes.TEXT) },
    nameAltLowerCase: { type: DataTypes.ARRAY(DataTypes.TEXT) },

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

    coordinate: { type: DataTypes.GEOMETRY },

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
      // Foreign key to CabinServiceLevel
      type: DataTypes.TEXT,
    },

    bedsExtra: { type: DataTypes.INTEGER, allowNull: false, default: 0 },
    bedsServiced: { type: DataTypes.INTEGER, allowNull: false, default: 0 },
    bedsSelfService: { type: DataTypes.INTEGER, allowNull: false, default: 0 },
    bedsUnmanned: { type: DataTypes.INTEGER, allowNull: false, default: 0 },
    bedsWinter: { type: DataTypes.INTEGER, allowNull: false, default: 0 },

    bookingEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    },
    bookingOnly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    },
    bookingUrl: { type: DataTypes.TEXT },

    htgtGeneral: { type: DataTypes.TEXT },
    htgtWinter: { type: DataTypes.TEXT },
    htgtSummer: { type: DataTypes.TEXT },
    htgtPublicTransport: { type: DataTypes.TEXT },
    htgtCarAllYear: { type: DataTypes.BOOLEAN },
    htgtCarSummer: { type: DataTypes.BOOLEAN },
    htgtBicycle: { type: DataTypes.BOOLEAN },
    htgtPublicTransportAvailable: { type: DataTypes.BOOLEAN },
    htgtBoatTransportAvailable: { type: DataTypes.BOOLEAN },

    map: { type: DataTypes.TEXT },
    mapAlt: { type: DataTypes.ARRAY(DataTypes.TEXT) },

    license: { type: DataTypes.TEXT },

    provider: { type: DataTypes.TEXT },

    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    dataSource: { type: DataTypes.TEXT },

    searchDocumentBoost: {
      type: DataTypes.FLOAT,
      default: 1,
      allowNull: false,
    },
  };

  const modelConfig = {
    timestamps: true,
  };


  const Cabin = sequelize.define('Cabin', attributeConfig, modelConfig);


  // Associations

  Cabin.associate = (models) => {
    models.Cabin.belongsTo(models.DocumentStatus, {
      foreignKey: 'status',
    });

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
      as: 'County',
      foreignKey: 'countyUuid',
    });

    models.Cabin.belongsTo(models.Municipality, {
      as: 'Municipality',
      foreignKey: 'municipalityUuid',
    });

    models.Cabin.belongsTo(models.CabinServiceLevel, {
      as: 'ServiceLevel',
      foreignKey: 'serviceLevel',
    });

    models.Cabin.belongsToMany(models.Area, {
      as: 'Areas',
      through: models.CabinToArea,
      foreignKey: 'cabinUuid',
    });

    models.Cabin.hasMany(models.CabinToArea, {
      as: 'CabinToAreaCabin',
      foreignKey: 'cabinUuid',
      sourceKey: 'uuid',
    });

    models.Cabin.belongsToMany(models.Tag, {
      through: {
        model: models.TagRelation,
        unique: false,
        scope: {
          taggedType: 'cabin',
        },
      },
      foreignKey: 'tagged_uuid',
      constraints: false,
    });

    models.Cabin.belongsToMany(models.List, {
      through: {
        model: models.ListRelation,
        unique: false,
        scope: {
          documentType: 'cabin',
        },
      },
      foreignKey: 'documentUuid',
      constraints: false,
    });

    models.Cabin.belongsToMany(models.Facility, {
      as: 'Facilities',
      through: { model: models.CabinFacility },
      foreignKey: 'cabinUuid',
    });

    models.Cabin.belongsToMany(models.Accessability, {
      as: 'Accessabilities',
      through: { model: models.CabinAccessability },
      foreignKey: 'cabinUuid',
    });
  };


  // HOOKS

  Cabin.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });


  // API CONFIGURATION

  Cabin.APIEntryModel = true;

  Cabin.getAPIConfig = (models) => {
    const config = { byReferrer: {} };

    // Configuration when it's the entry model
    config.byReferrer['*onEntry'] = {
      paginate: true,
      fullTextSearch: true,
      ordering: true,

      defaultLimit: 10,
      maxLimit: 50,
      validOrderFields: [
        'name',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['name', 'ASC']],
      // validFields - true/false if they should be returned from API as
      // default if no ?fields=.. parameter is specified
      validFields: {
        uri: true,
        id: true,
        idSsr: true,
        dntCabin: true,
        dntDiscount: true,
        name: true,
        nameAlt: true,
        description: true,
        contactDetails: true, // constructed object
        url: true,
        yearOfConstruction: true,
        coordinate: true,
        map: true,
        serviceLevel: true,
        beds: true, // constructed object
        booking: true, // constructed object
        htgt: true, // constructed object
        license: true,
        provider: true,
        status: true,
        dataSource: true,
        updatedAt: true,
        createdAt: false,
      },
      include: {
        // maintainerGroup
        // ownerGroup
        // contactGroup
        // county
        // municipality

        areas: {
          includeByDefault: false,
          model: models.Area,
          through: {
            association: 'CabinToAreaArea',
            reverseAssociation: 'Area',
            otherKey: 'cabinUuid',
            foreignKey: 'areaUuid',
          },
        },
      },
    };

    // Default configuration when included from another model
    config.byReferrer.default = {
      ...config.byReferrer['*onEntry'],

      validFields: {
        // Allow the same fields as '*onEntry' but set them to default false
        ...Object.assign(
          {},
          ...(
            Object.keys(config.byReferrer['*onEntry'].validFields)
              .map((f) => ({
                [f]: false,
              }))
          )
        ),
        uri: true,
        id: true,
        name: true,
      },

      include: {
        // parents: {
        //   ...config.byReferrer['*onEntry'].include.parents,
        //   includeByDefault: false,
        // },
        // children: {
        //   ...config.byReferrer['*onEntry'].include.children,
        //   includeByDefault: false,
        // },
      },
    };

    return config;
  };

  Cabin.fieldsToAttributes = (fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'uri':
          return null;
        case 'id':
          return ['uuid'];
        case 'contactDetails':
          return [
            'contactName',
            'email',
            'phone',
            'mobile',
            'fax',
            'address1',
            'address2',
            'postalCode',
            'postalName',
          ];
        case 'beds':
          return [
            'bedsExtra',
            'bedsServiced',
            'bedsSelfService',
            'bedsUnmanned',
            'bedsWinter',
          ];
        case 'booking':
          return [
            'bookingEnabled',
            'bookingOnly',
            'bookingUrl',
          ];
        case 'htgt':
          return [
            'htgtGeneral',
            'htgtWinter',
            'htgtSummer',
            'htgtPublicTransport',
            'htgtCarAllYear',
            'htgtCarSummer',
            'htgtBicycle',
            'htgtPublicTransportAvailable',
            'htgtBoatTransportAvailable',
          ];
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


  Cabin.prototype.format = function format() {
    return {
      uri: `cabin/${this.uuid}`,
      id: this.uuid,
      idSsr: this.idSsr,
      dntCabin: this.dntCabin,
      dntDiscount: this.dntDiscount,
      name: this.name,
      nameAlt: this.nameAlt,
      description: this.description,
      contactDetails: {
        name: this.contactName,
        email: this.email,
        phone: this.phone,
        mobile: this.mobile,
        fax: this.fax,
        address1: this.address1,
        address2: this.address2,
        postalCode: this.postalCode,
        postalName: this.postalName,
      },
      url: this.url,
      yearOfConstruction: this.yearOfConstruction,
      coordinate: this.coordinate,
      map: this.map,
      serviceLevel: this.serviceLevel,
      beds: {
        staffed: this.bedsServiced,
        selfService: this.bedsSelfService,
        extra: this.bedsExtra,
        noService: this.bedsUnmanned,
        winter: this.bedsWinter,
      },
      booking: {
        enabled: this.bookingEnabled,
        onlyBooking: this.bookingOnly,
        url: this.bookingUrl,
      },
      htgt: {
        general: this.htgtGeneral,
        winter: this.htgtWinter,
        summer: this.htgtSummer,
        publicTransport: {
          available: this.htgtPublicTransportAvailable,
          description: this.htgtPublicTransport,
        },
        boatTransport: this.htgtBoatTransportAvailable,
        carAllYear: this.htgtCarAllYear,
        carSummer: this.htgtCarSummer,
        bicycle: this.htgtBicycle,
      },
      license: this.license,
      provider: this.provider,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
  };

  return Cabin;
};
