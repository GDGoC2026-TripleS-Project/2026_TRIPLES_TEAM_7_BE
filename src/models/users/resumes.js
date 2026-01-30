const Sequelize = require('sequelize');

module.exports = class resumes extends Sequelize.Model {
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
      fileUrl: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      paranoid: true,
      createdAt: 'createdAt',
      updatedAt: false,
      deletedAt: 'deletedAt',
      modelName: 'resumes',
      tableName: 'resumes',
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.resumes.belongsTo (db.User, { foreignKey: 'userId', targetKey: 'id' });
  }
};
