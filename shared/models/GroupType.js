export default (sequelize, DataTypes) => {
  const GroupType = sequelize.define('GroupType', {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    parent: {
      type: DataTypes.TEXT,
    },

    description: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });


  // Associations

  GroupType.associate = (models) => {
    models.GroupType.belongsTo(models.GroupType, {
      as: 'Parent',
      foreignKey: 'parent',
    });
  };

  return GroupType;
};
