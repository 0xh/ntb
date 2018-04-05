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
    boost: { type: DataTypes.FLOAT },

    // field used for defining different weight for different fields for
    // each document type
    // A, B, C, D
    weight: { type: DataTypes.CHAR(1) },
  }, {
    timestamps: false,
  });

  return SearchConfig;
};
