const Sequelize = require('sequelize');

module.exports = class job_cards extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      jobPostId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'job_posts',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      fileUrl: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      deadlineAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      jobTitle: { 
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      companyName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      employmentType: { 
        type: Sequelize.ENUM('FULL_TIME', 'CONTRACT', 'INTERN'), // 정규직, 계약직, 인턴십
        allowNull: false,
      },
      roleText: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      necessaryStack: { 
        type: Sequelize.JSON,
        allowNull: true,
      },
      preferStack: { 
        type: Sequelize.JSON,
        allowNull: true,
      },
      salaryText: { 
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      locationText: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      experienceLevel: { 
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      workDay: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      addressPoint: {
        type: Sequelize.GEOMETRY('POINT'),
        allowNull: true,
      },
      cardStatus: { 
        type: Sequelize.ENUM('CANVAS', 'INTERVIEW'), // 캔버스, 인터뷰
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
      modelName: 'job_cards',
      tableName: 'job_cards',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.job_cards.hasOne(db.canvas_items, { foreignKey: 'cardId', sourceKey: 'id' });
    db.job_cards.hasMany(db.interview_question_sets, { foreignKey: 'cardId', sourceKey: 'id' });
    db.job_cards.hasOne(db.match_percent, { foreignKey: 'cardId', sourceKey: 'id' });
    db.job_cards.hasMany(db.saved_interview_questions, { foreignKey: 'cardId', sourceKey: 'id' });

    db.job_cards.belongsTo (db.User, { foreignKey: 'userId', targetKey: 'id' });
    db.job_cards.belongsTo (db.job_posts, { foreignKey: 'jobPostId', targetKey: 'id' });
  }
};
