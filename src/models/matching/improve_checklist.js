const Sequelize = require('sequelize');

module.exports = class improve_checklist extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      isButtonActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      checkListText: { 
        type: Sequelize.STRING(255),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      createdAt: 'createdAt',
      updatedAt: false,      // updatedAt이 필요없다면 false
      deletedAt: false, // paranoid true면 필요
      modelName: 'improve_checklist',
      tableName: 'improve_checklist',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.improve_checklist.belongsTo (db.match_result, { foreignKey: 'matchResultId', targetKey: 'id' });
  }
};
