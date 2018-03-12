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

    type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    title: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT, allowNull: false },

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

  CabinLink.associate = (models) => {
    models.CabinLink.belongsTo(models.Cabin);
  };

  return CabinLink;
};
