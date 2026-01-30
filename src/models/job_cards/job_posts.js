const Sequelize = require('sequelize');

module.exports = class job_posts extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        jobTitle: { 
            type: Sequelize.STRING(10),
            allowNull: false,
        },
        originalUrl: { 
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        fetchedAt: { 
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
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
      createdAt: 'fetchedAt',
      modelName: 'job_posts',
      tableName: 'job_posts',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.job_posts.hasOne(db.job_cards, { foreignKey: 'jobPostId', sourceKey: 'id' });
  }
};
