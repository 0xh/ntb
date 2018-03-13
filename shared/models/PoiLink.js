export default (sequelize, DataTypes) => {
  const PoiLink = sequelize.define('PoiLink', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    poiUuid: {
      type: DataTypes.UUID,
      unique: 'poi-link-sort-index-key',
      allowNull: false,
      validate: {
        isUUID: 4,
      },
    },

    title: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT, allowNull: false },

    sortIndex: {
      type: DataTypes.INTEGER,
      unique: 'poi-link-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  PoiLink.associate = (models) => {
    models.PoiLink.belongsTo(models.Poi);
  };

  return PoiLink;
};
