export default (sequelize, DataTypes) => {
  const GroupLink = sequelize.define('GroupLink', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    groupUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: 'group-link-sort-index-key',
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
      unique: 'group-link-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  GroupLink.associate = (models) => {
    models.GroupLink.belongsTo(models.Group);
  };

  return GroupLink;
};
