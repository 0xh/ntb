export default (sequelize, DataTypes) => {
  const SearchConfig = sequelize.define('SearchConfig', {
    name: {
      type: DataTypes.TEXT,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },

    // Numeric boost - field used for document type boost
    boost: {
      type: DataTypes.FLOAT,
    },

    // field used for defining different weight for different fields for
    // each document type
    weight: {
      type: DataTypes.ENUM,
      values: ['A', 'B', 'C', 'D'],
    },
  }, {
    timestamps: false,
  });

  return SearchConfig;
};
