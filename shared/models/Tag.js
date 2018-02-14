export default (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    nameLowerCase: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
    },
  }, {
    timestamps: false,
  });


  // Associations

  Tag.associate = (models) => {
    models.Tag.belongsToMany(models.Group, {
      through: {
        model: models.TagRelation,
        unique: false,
      },
      as: 'Groups',
      foreignKey: 'tag_name',
      constraints: false,
    });
  };


  // HOOKS

  Tag.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Tag;
};
