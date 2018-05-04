import { disableAllFields, disableAllIncludes } from './utils';


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

    groupType: { type: DataTypes.TEXT },
    groupSubType: { type: DataTypes.TEXT },

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

    description: { type: DataTypes.TEXT },
    descriptionPlain: { type: DataTypes.TEXT },

    logo: { type: DataTypes.TEXT },
    organizationNumber: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT },
    email: { type: DataTypes.TEXT },
    phone: { type: DataTypes.TEXT },
    mobile: { type: DataTypes.TEXT },
    fax: { type: DataTypes.TEXT },
    address1: { type: DataTypes.TEXT },
    address2: { type: DataTypes.TEXT },
    postalCode: { type: DataTypes.TEXT },
    postalName: { type: DataTypes.TEXT },

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

  const Group = sequelize.define('Group', attributeConfig, modelConfig);


  // Associations

  Group.associate = (models) => {
    models.Group.belongsTo(models.DocumentStatus, {
      foreignKey: 'status',
    });

    models.Group.belongsTo(models.GroupType, {
      as: 'GroupType',
      foreignKey: 'groupType',
    });

    models.Group.belongsTo(models.GroupType, {
      as: 'GroupSubType',
      foreignKey: 'groupSubType',
    });

    models.Group.belongsTo(models.Municipality);

    models.Group.belongsToMany(models.Tag, {
      through: {
        model: models.TagRelation,
        unique: false,
        scope: {
          taggedType: 'group',
        },
      },
      foreignKey: 'taggedUuid',
      constraints: false,
    });

    models.Group.belongsToMany(models.Poi, {
      as: 'Pois',
      through: models.PoiToGroup,
      foreignKey: 'groupUuid',
    });

    models.Group.belongsToMany(models.List, {
      as: 'Lists',
      through: models.ListToGroup,
      foreignKey: 'groupUuid',
    });

    models.Group.hasMany(models.Cabin, {
      as: 'OwnsCabins',
      foreignKey: 'uuid',
      targetKey: 'ownerGroupUuid',
    });
  };


  // API CONFIGURATION

  Group.APIEntryModel = true;

  Group.getAPIConfig = (models) => {
    const config = { byReferrer: {} };

    // Configuration when it's the entry model
    config.byReferrer['*list'] = {
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
        type: true,
        subType: true,
        name: true,
        description: true,
        logo: true,
        organizationNumber: true,
        url: true,
        email: true,
        phone: true,
        mobile: true,
        fax: true,
        address1: true,
        address2: true,
        postalCode: true,
        postalName: true,
        license: true,
        provider: true,
        status: true,
        dataSource: false,
        updatedAt: true,
        createdAt: false,
      },
      include: {
        // TODO(Roar):
        // municipality
        // poi
        // pois
        // lists
        // links
        // cabins - owner
        // cabins - maintainer
        // cabins - contact
        ownsCabins: {
          includeByDefault: false,
          association: 'OwnsCabins',
        },
      },
    };

    // Default configuration when included from another model
    config.byReferrer.default = {
      ...config.byReferrer['*list'],

      validFields: {
        // Allow the same fields as '*list' but set them to default false
        ...disableAllFields(config, '*list'),
        uri: true,
        id: true,
        type: true,
        subType: true,
        name: true,
        description: true,
        logo: true,
        organizationNumber: true,
        url: true,
        email: true,
        phone: true,
        mobile: true,
        fax: true,
        address1: true,
        address2: true,
        postalCode: true,
        postalName: true,
      },

      include: {
        ...disableAllIncludes(config, '*list'),
      },
    };

    return config;
  };

  Group.fieldsToAttributes = (fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'uri':
          return null;
        case 'id':
          return ['uuid'];
        case 'type':
          return ['groupType'];
        case 'subType':
          return ['groupSubType'];
        case 'createdAt':
        case 'updatedAt':
          if (modelConfig.timestamps) {
            return [field];
          }
          throw new Error(
            `Unable to translate field ${field} on Group model`
          );
        default:
          if (Object.keys(attributeConfig).includes(field)) {
            return [field];
          }
          throw new Error(
            `Unable to translate field ${field} on Group model`
          );
      }
    }).filter((field) => field !== null));

    return attributes;
  };


  Group.prototype.format = function format() {
    return {
      uri: `group/${this.uuid}`,
      id: this.uuid,
      type: this.groupType,
      subType: this.groupSubType,
      name: this.name,
      description: this.description && this.description.length
        ? this.description
        : null,
      logo: this.logo,
      organizationNumber: this.organizationNumber,
      url: this.url,
      email: this.email,
      phone: this.phone,
      mobile: this.mobile,
      fax: this.fax,
      address1: this.address1,
      address2: this.address2,
      postalCode: this.postalCode,
      postalName: this.postalName,
      license: this.license,
      provider: this.provider,
      status: this.status,
      dataSource: this.dataSource,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
  };

  return Group;
};
