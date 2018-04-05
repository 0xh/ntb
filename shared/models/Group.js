export default (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
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
  }, {
    timestamps: true,
  });


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
  };

  // Class methods :: Search

  Group.search = (query) => {
    const escapedQuery = sequelize.getQueryInterface().escape(query);

    return sequelize
      .query(
        [
          `SELECT * FROM "${Group.tableName}"`,
          'WHERE',
          `  "search" @@ to_tsquery('norwegian', ${escapedQuery})`,
        ].join('\n'),
        Group
      );
  };

  return Group;
};
