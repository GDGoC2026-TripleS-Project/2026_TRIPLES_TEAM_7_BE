const Sequelize = require('sequelize');

module.exports = class interview_question_sets extends Sequelize.Model {
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
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      createdAt: 'generatedAt',
      updatedAt: false,
      deletedAt: false,
      modelName: 'interview_question_sets',
      tableName: 'interview_question_sets',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.interview_question_sets.hasMany(db.interview_questions, { foreignKey: 'setId', sourceKey: 'id' });

    db.interview_question_sets.belongsTo (db.job_cards, { foreignKey: 'cardId', targetKey: 'id' });
  }
};
