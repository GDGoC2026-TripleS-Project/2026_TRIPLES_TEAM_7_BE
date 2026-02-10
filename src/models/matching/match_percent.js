const Sequelize = require('sequelize');

module.exports = class match_percent extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      cardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'job_cards',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      matchPercent: { 
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      createdAt: 'createdAt',
      updatedAt: false,
      deletedAt: 'deletedAt',
      modelName: 'match_percent',
      tableName: 'match_percent',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.match_percent.hasMany(db.match_result, { foreignKey: 'matchId', sourceKey: 'id' });

    db.match_percent.belongsTo (db.job_cards, { foreignKey: 'cardId', targetKey: 'id' });
  }
};
