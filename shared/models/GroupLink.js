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

    type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    title: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT, allowNull: false },

    // The legacy-ntb id of the group this link belongs to
    // This field is used (together with idxGroupLegacyNtb) to update or create
    // when harvesting from legacy-ntb
    idGroupLegacyNtb: {
      type: DataTypes.TEXT,
      unique: 'group-link-legacy-ntb-key',
    },

    // The legacy-ntb index of the group link array
    // This field is used (together with idGroupLegacyNtb) to update or create
    // when harvesting from legacy-ntb
    idxGroupLegacyNtb: {
      type: DataTypes.INTEGER,
      unique: 'group-link-legacy-ntb-key',
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
