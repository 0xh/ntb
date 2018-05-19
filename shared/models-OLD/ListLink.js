export default (sequelize, DataTypes) => {
  const ListLink = sequelize.define('ListLink', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    listUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: 'list-link-sort-index-key',
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
      unique: 'list-link-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  ListLink.associate = (models) => {
    models.ListLink.belongsTo(models.List, {
      as: 'List',
      foreignKey: 'listUuid',
    });
  };

  return ListLink;
};
