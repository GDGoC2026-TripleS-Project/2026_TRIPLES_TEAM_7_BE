const Sequelize = require('sequelize');

module.exports = class interview_questions extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      setId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'interview_question_sets',
          key: 'id' 
        },
        onDelete: 'CASCADE'
      },
      questionText: { 
        type: Sequelize.TEXT,
        allowNull: false,
      },
      orderNo: {
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
      deletedAt: false,
      modelName: 'interview_questions',
      tableName: 'interview_questions',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.interview_questions.hasMany(db.saved_interview_questions, { foreignKey: 'questionId', sourceKey: 'id' });

    db.interview_questions.belongsTo (db.interview_question_sets, { foreignKey: 'setId', targetKey: 'id' });
  }
};
