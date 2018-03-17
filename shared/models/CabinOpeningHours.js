export default (sequelize, DataTypes) => {
  const CabinOpeningHours = sequelize.define('CabinOpeningHours', {
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

    allYear: { type: DataTypes.BOOLEAN, default: false, allowNull: false },
    from: { type: DataTypes.DATE },
    to: { type: DataTypes.DATE },

    serviceLevel: {
      // Foreign key to CabinServiceLevel
      type: DataTypes.TEXT,
    },

    key: {
      type: DataTypes.ENUM,
      values: [
        'unlocked',
        'dnt-key',
        'special key',
      ],
    },

    sortIndex: {
      type: DataTypes.INTEGER,
      unique: 'cabin-link-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  CabinOpeningHours.associate = (models) => {
    models.CabinOpeningHours.belongsTo(models.Cabin);

    models.CabinOpeningHours.belongsTo(models.CabinServiceLevel, {
      as: 'ServiceLevel',
      foreignKey: 'serviceLevel',
    });
  };

  return CabinOpeningHours;
};
