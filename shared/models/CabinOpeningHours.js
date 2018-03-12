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

    allYear: { type: DataTypes.BOOLEAN, default: false, allowNull: false },
    from: { type: DataTypes.DATE },
    to: { type: DataTypes.DATE },

    serviceLevel: {
      type: DataTypes.ENUM,
      values: [
        'self service',
        'serviced',
        'unmanned',
        'closed',
        'dining',
        'unmanned (no beds)',
        'emergency shelter',
      ],
    },

    key: {
      type: DataTypes.ENUM,
      values: [
        'unlocked',
        'dnt-key',
        'special key',
      ],
    },

    // The legacy-ntb id of the cabin this link belongs to
    // This field is used (together with idxCabinLegacyNtb) to update or create
    // when harvesting from legacy-ntb
    idCabinLegacyNtb: {
      type: DataTypes.TEXT,
      unique: 'cabin-link-legacy-ntb-key',
    },

    // The legacy-ntb index of the cabin link array
    // This field is used (together with idCabinLegacyNtb) to update or create
    // when harvesting from legacy-ntb
    idxCabinLegacyNtb: {
      type: DataTypes.INTEGER,
      unique: 'cabin-link-legacy-ntb-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  CabinOpeningHours.associate = (models) => {
    models.CabinOpeningHours.belongsTo(models.Cabin);
  };

  return CabinOpeningHours;
};
