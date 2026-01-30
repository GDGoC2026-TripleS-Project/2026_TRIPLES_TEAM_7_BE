const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      firebase_uid: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      addressPoint: {
        type: Sequelize.GEOMETRY('POINT'),
        allowNull: true,
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      createdAt: 'createdAt',
      updatedAt: false,
      deletedAt: 'deletedAt',
      modelName: 'User',
      tableName: 'users',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.job_cards, { foreignKey: 'userId', sourceKey: 'id' });
    db.User.hasMany(db.saved_interview_questions, { foreignKey: 'userId', sourceKey: 'id' });
    db.User.hasMany(db.match_result, { foreignKey: 'userId', sourceKey: 'id' });
    db.User.hasMany(db.resumes, { foreignKey: 'userId', sourceKey: 'id' });
  }
};
