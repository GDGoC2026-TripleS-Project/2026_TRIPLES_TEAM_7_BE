const Sequelize = require('sequelize');

module.exports = class match_result extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      matchId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'match_percent',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      fileUrl: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      cardStatus: { 
        type: Sequelize.ENUM('STRENGTH', 'GAP', 'RISK'), // 캔버스, 인터뷰
        allowNull: false,
      },
      matchResultComment: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      matchResultTitle: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      isRequired: {  //필수조건
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },

    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      paranoid: false,
      modelName: 'match_result',
      tableName: 'match_result',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.match_result.hasMany(db.improve_checklist, { foreignKey: 'matchResultId', sourceKey: 'id' });

    db.match_result.belongsTo (db.User, { foreignKey: 'userId', targetKey: 'id' });
    db.match_result.belongsTo (db.match_percent, { foreignKey: 'matchId', targetKey: 'id' });
  }
};
