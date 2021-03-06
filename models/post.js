const Sequelize = require('sequelize');
const moment = require('moment');

module.exports = class Post extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
        },
        imageUrl: {
          type: Sequelize.STRING(255),
        },
        active: {
          type: Sequelize.TINYINT,
          defaultValue: true,
        },
        layout: {
          type: Sequelize.STRING(10),
          defaultValue: 'top',
        },
        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Date.now(),
          get() {
            return moment(this.getDataValue('createdAt')).format(
              'YYYY-MM-DD HH:mm:ss'
            );
          },
        },
        updatedAt: {
          type: Sequelize.DATE,
          get() {
            return moment(this.getDataValue('updatedAt')).format(
              'YYYY-MM-DD HH:mm:ss'
            );
          },
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modelName: 'Post',
        tableName: 'posts',
        paranoid: false,
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  }
  static associate(db) {
    db.Post.belongsTo(db.User, { foreignKey: 'user_id', sourceKey: 'id' });
    db.Post.hasMany(db.Comment, { foreignKey: 'post_id', sourceKey: 'id' });
    db.Post.hasMany(db.Like, { foreignKey: 'post_id', sourceKey: 'id' });
  }
};
