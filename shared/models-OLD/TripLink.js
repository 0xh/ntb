export default (sequelize, DataTypes) => {
  const TripLink = sequelize.define('TripLink', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    tripUuid: {
      type: DataTypes.UUID,
      unique: 'trip-link-sort-index-key',
      allowNull: false,
      validate: {
        isUUID: 4,
      },
    },

    title: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT, allowNull: false },

    sortIndex: {
      type: DataTypes.INTEGER,
      unique: 'trip-link-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  TripLink.associate = (models) => {
    models.TripLink.belongsTo(models.Trip);
  };

  return TripLink;
};
