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

    idLegacyNtb: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: true,
    },

    type: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    name: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: true,
      },
    },

    nameLowerCase: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: true,
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    descriptionPlain: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    descriptionWords: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    descriptionWordsStemmed: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    logo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    organizationNumber: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    email: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    phone: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    mobile: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fax: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    address1: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    address2: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    postalCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    postalName: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    license: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    provider: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM,
      values: ['draft', 'public', 'deleted', 'private'],
    },

    dataSource: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });


  // Associations

  Group.associate = (models) => {
    models.Group.belongsTo(models.Municipality);
  };

  return Group;
};
