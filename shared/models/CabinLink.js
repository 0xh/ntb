export default (sequelize, DataTypes) => {
  const CabinLink = sequelize.define('CabinLink', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    cabinUuid: {
      type: DataTypes.UUID,
      unique: 'cabin-link-sort-index-key',
      validate: {
        isUUID: 4,
      },
    },

    type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    title: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT, allowNull: false },

    sortIndex: {
      type: DataTypes.INTEGER,
      unique: 'cabin-link-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  CabinLink.associate = (models) => {
    models.CabinLink.belongsTo(models.Cabin);
  };

  return CabinLink;
};
