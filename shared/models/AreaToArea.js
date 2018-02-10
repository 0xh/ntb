export default (sequelize, DataTypes) => {
  const AreaToArea = sequelize.define('AreaToArea', {
    parentUuid: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    childUuid: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    dataSource: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });


  // Associations

  AreaToArea.associate = (models) => {
    models.AreaToArea.belongsTo(models.Area, {
      as: 'Parent',
      foreignKey: 'parentUuid',
    });

    models.AreaToArea.belongsTo(models.Area, {
      as: 'Child',
      foreignKey: 'childUuid',
    });
  };

  return AreaToArea;
};
