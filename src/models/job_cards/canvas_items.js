const Sequelize = require('sequelize');

module.exports = class canvas_items extends Sequelize.Model {
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
      canvas_x: { 
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      canvas_y: { 
        type: Sequelize.FLOAT,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      createdAt: false,
      updatedAt: 'updatedAt',
      deletedAt: false,
      modelName: 'canvas_items',
      tableName: 'canvas_items',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.canvas_items.belongsTo (db.job_cards, { foreignKey: 'cardId', targetKey: 'id' });
  }
};
