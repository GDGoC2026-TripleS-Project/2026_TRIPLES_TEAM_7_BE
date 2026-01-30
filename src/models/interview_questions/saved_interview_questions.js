const Sequelize = require('sequelize');

module.exports = class saved_interview_questions extends Sequelize.Model {
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
      cardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'job_cards',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'interview_questions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      fileUrl: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      questionTextSnapshot: { 
        type: Sequelize.TEXT,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      createdAt: 'savedAt',
      updatedAt: false,
      deletedAt: 'deletedAt', 
      modelName: 'saved_interview_questions',
      tableName: 'saved_interview_questions',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.saved_interview_questions.belongsTo (db.interview_questions, { foreignKey: 'questionId', targetKey: 'id' });
    db.saved_interview_questions.belongsTo (db.User, { foreignKey: 'userId', targetKey: 'id' });
    db.saved_interview_questions.belongsTo (db.job_cards, { foreignKey: 'cardId', targetKey: 'id' });
  }
};
