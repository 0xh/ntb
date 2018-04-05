export default (sequelize, DataTypes) => {
  const List = sequelize.define('List', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtb: { type: DataTypes.TEXT, unique: true },

    listType: { type: DataTypes.TEXT, allowNull: false },

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

    coordinates: { type: DataTypes.GEOMETRY },

    startDate: { type: DataTypes.DATE },
    endDate: { type: DataTypes.DATE },

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

  List.associate = (models) => {
    models.List.belongsTo(models.DocumentStatus, {
      foreignKey: 'status',
    });

    models.List.belongsTo(models.ListType, {
      as: 'ListType',
      foreignKey: 'listType',
    });

    models.List.belongsToMany(models.County, {
      as: 'Counties',
      through: models.ListToCounty,
      foreignKey: 'listUuid',
    });

    models.List.belongsToMany(models.Municipality, {
      as: 'Municipalities',
      through: models.ListToMunicipality,
      foreignKey: 'listUuid',
    });

    models.List.belongsToMany(models.Group, {
      as: 'Groups',
      through: models.ListToGroup,
      foreignKey: 'listUuid',
    });
  };

  return List;
};
