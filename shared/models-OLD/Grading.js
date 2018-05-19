export default (sequelize, DataTypes) => {
  const Grading =
    sequelize.define('Grading', {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
    }, {
      timestamps: false,
    });

  return Grading;
};
