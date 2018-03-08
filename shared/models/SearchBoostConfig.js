export default (sequelize, DataTypes) => {
  const SearchBoostConfig = sequelize.define('SearchBoostConfig', {
    name: {
      type: DataTypes.TEXT,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },

    // Foreign key to Area
    boost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  }, {
    timestamps: false,
  });

  return SearchBoostConfig;
};
