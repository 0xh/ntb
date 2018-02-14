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
    },

    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    url: {
      type: DataTypes.TEXT,
    },

    // The legacy-ntb id of the group this link belongs to
    // This field is used (together with idxGroupLegacyNtb) to update or create
    // when harvesting from legacy-ntb
    idGroupLegacyNtb: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: 'group-link-legacy-ntb-key',
    },

    // The legacy-ntb index of the group link array
    // This field is used (together with idGroupLegacyNtb) to update or create
    // when harvesting from legacy-ntb
    idxGroupLegacyNtb: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: 'group-link-legacy-ntb-key',
    },

    dataSource: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });


  // Associations

  GroupLink.associate = (models) => {
    models.GroupLink.belongsTo(models.Group);
  };

  return GroupLink;
};
